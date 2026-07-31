import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { inject, injectable } from 'inversify';
import { getRazorpayClient, getRazorpayCredentials } from '../config/razorpay';
import { TYPES } from '../config/ioc.types';
import { CheckoutResultDto, CheckoutSummaryDto, RazorpayOrderDto } from '../dtos/checkout.dto';
import ClientError from '../exceptions/client-error';
import NotFoundError from '../exceptions/not-found-error';
import { CheckoutAdjustmentsModel, DirectCheckoutModel, VerifyRazorpayPaymentModel } from '../models/checkout.model';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { CheckoutContext, ICheckoutService } from './interfaces/Icheckout.service';
import { IOrderService } from './interfaces/Iorder.service';

/**
 * Razorpay works in the smallest currency unit, and the `currency` column allows
 * only 3 characters. The cart's stored default is a non-ISO value in some rows, so
 * normalise to a real ISO 4217 code before talking to the gateway.
 */
const GATEWAY_CURRENCY = 'INR';

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Constant-time comparison that tolerates differing lengths. */
function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

@injectable()
export class CheckoutService implements ICheckoutService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.IOrderService) private orderService: IOrderService
  ) { }

  /** The active cart, guaranteed to exist and hold at least one line. */
  private async requireCart(ctx: CheckoutContext) {
    const cart = await this.unitOfWork.Cart.getActive(ctx.owner);
    if (!cart || cart.items.length === 0) {
      throw new ClientError('Your cart is empty, so there is nothing to check out.');
    }
    return cart;
  }

  private totalsFrom(subtotal: number, adjustments: CheckoutAdjustmentsModel) {
    const discount = Number(adjustments.discount ?? 0);
    const tax = Number(adjustments.tax ?? 0);
    const shippingCost = Number(adjustments.shippingCost ?? 0);

    for (const [label, value] of [['discount', discount], ['tax', tax], ['shipping cost', shippingCost]] as const) {
      if (!Number.isFinite(value) || value < 0) throw new ClientError(`The ${label} must be zero or more.`);
    }

    const grandTotal = subtotal + tax + shippingCost - discount;
    if (grandTotal < 0) {
      throw new ClientError('The discount cannot be larger than the order total.');
    }

    return { discount, tax, shippingCost, grandTotal };
  }

  async getSummary(ctx: CheckoutContext, adjustments: CheckoutAdjustmentsModel): Promise<CheckoutSummaryDto> {
    const cart = await this.requireCart(ctx);
    const { discount, tax, shippingCost, grandTotal } = this.totalsFrom(cart.totalAmount, adjustments);

    return {
      subtotal: cart.totalAmount,
      discount,
      tax,
      shippingCost,
      grandTotal,
      currency: GATEWAY_CURRENCY,
      itemCount: cart.itemCount,
      totalQuantity: cart.totalQuantity,
    };
  }

  async createRazorpayOrder(ctx: CheckoutContext, adjustments: CheckoutAdjustmentsModel): Promise<RazorpayOrderDto> {
    const cart = await this.requireCart(ctx);
    const { grandTotal } = this.totalsFrom(cart.totalAmount, adjustments);

    if (grandTotal <= 0) {
      throw new ClientError('The payable amount must be greater than zero. Use direct checkout for a zero-value order.');
    }

    const { keyId } = getRazorpayCredentials();

    const order = await getRazorpayClient().orders.create({
      amount: toMinorUnits(grandTotal),
      currency: GATEWAY_CURRENCY,
      // Ties the gateway order back to this cart without trusting the client later.
      notes: { cartId: String(cart.id), storeCode: ctx.storeCode, userId: ctx.userId },
    });

    return {
      keyId,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      displayAmount: grandTotal,
    };
  }

  async completeRazorpayCheckout(ctx: CheckoutContext, model: VerifyRazorpayPaymentModel): Promise<CheckoutResultDto> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = model;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ClientError('The payment response from the gateway was incomplete.');
    }

    // Idempotency first: a retried or replayed callback must return the original
    // order rather than charging stock and creating a duplicate.
    const existingPayment = await this.unitOfWork.Payment.findByTransactionId(razorpay_payment_id);
    if (existingPayment) {
      const existingOrder = await this.unitOfWork.Order.findById(existingPayment.orderId);
      if (!existingOrder) throw new NotFoundError('The order for this payment no longer exists.');
      return { order: existingOrder, payment: existingPayment, alreadyProcessed: true };
    }

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeCompare(expectedSignature, razorpay_signature)) {
      throw new ClientError('Payment signature verification failed. The payment was not accepted.');
    }

    const cart = await this.requireCart(ctx);
    const { discount, tax, shippingCost, grandTotal } = this.totalsFrom(cart.totalAmount, model);

    // The signature only proves the response is genuine, not that it matches what
    // this order is worth - so confirm the gateway captured the expected amount.
    const gatewayOrder = await getRazorpayClient().orders.fetch(razorpay_order_id);
    const expectedMinor = toMinorUnits(grandTotal);
    if (Number(gatewayOrder.amount) !== expectedMinor) {
      throw new ClientError(
        `The paid amount no longer matches this order (paid ${Number(gatewayOrder.amount) / 100}, order is ${grandTotal}). ` +
        'The cart changed after payment started, so nothing was recorded. Please review the cart and try again.'
      );
    }

    const order = await this.orderService.create(
      {
        customerId: model.customerId,
        discount,
        tax,
        shippingCost,
        notes: model.notes ?? null,
        // Paid up front, so the order does not sit in PENDING awaiting money.
        status: OrderStatus.CONFIRMED,
        // The cart is already variant-keyed, so the chosen size/colour carries through to the
        // order line instead of being flattened back to the product.
        items: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      },
      ctx.storeCode,
      ctx.userId,
      ctx.userName
    );

    const payment = await this.unitOfWork.Payment.create({
      orderId: order.id,
      storeCode: ctx.storeCode,
      amount: order.grandTotal,
      method: PaymentMethod.ONLINE,
      status: PaymentStatus.PAID,
      transactionId: razorpay_payment_id,
      remarks: `Razorpay ${razorpay_order_id}`,
    });

    await this.unitOfWork.Cart.clearItems(cart.id);

    return { order, payment, alreadyProcessed: false };
  }

  async checkoutDirect(ctx: CheckoutContext, model: DirectCheckoutModel): Promise<CheckoutResultDto> {
    const cart = await this.requireCart(ctx);
    const { discount, tax, shippingCost } = this.totalsFrom(cart.totalAmount, model);

    const order = await this.orderService.create(
      {
        customerId: model.customerId,
        discount,
        tax,
        shippingCost,
        notes: model.notes ?? null,
        // No money has moved, so the order stays PENDING until it is settled.
        status: OrderStatus.PENDING,
        // The cart is already variant-keyed, so the chosen size/colour carries through to the
        // order line instead of being flattened back to the product.
        items: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      },
      ctx.storeCode,
      ctx.userId,
      ctx.userName
    );

    // No payment row at all - direct checkout mirrors the POS screen, which
    // records the order only and leaves payment to the Payments module.
    await this.unitOfWork.Cart.clearItems(cart.id);

    return { order, payment: null, alreadyProcessed: false };
  }
}
