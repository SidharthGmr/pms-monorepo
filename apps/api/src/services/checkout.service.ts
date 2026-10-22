import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { inject, injectable } from 'inversify';
import { getRazorpayClient, getRazorpayCredentials } from '../config/razorpay';
import { TYPES } from '../config/ioc.types';
import { CartDto, CheckoutResultDto, CheckoutSummaryDto, RazorpayOrderDto, CheckoutAdjustmentsModel, DirectCheckoutModel, VerifyRazorpayPaymentModel } from '@pms/types';
import ClientError from '../exceptions/client-error';
import NotFoundError from '../exceptions/not-found-error';

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

  /**
   * Any charge the operator leaves out defaults to what the cart already computed from the
   * store settings, so a plain checkout is billed exactly as the cart page showed it. The
   * order table has no platform-fee column, so that fee is booked together with shipping.
   */
  private totalsFrom(cart: CartDto, adjustments: CheckoutAdjustmentsModel) {
    const subtotal = cart.totalAmount;
    const discount = Number(adjustments.discount ?? 0);
    const tax = Number(adjustments.tax ?? cart.charges.tax);
    const shippingCost = Number(adjustments.shippingCost ?? cart.charges.shippingCharge);
    const platformFee = Number(adjustments.platformFee ?? cart.charges.platformFee);

    for (const [label, value] of [['discount', discount], ['tax', tax], ['shipping cost', shippingCost], ['platform fee', platformFee]] as const) {
      if (!Number.isFinite(value) || value < 0) throw new ClientError(`The ${label} must be zero or more.`);
    }

    const grandTotal = Math.round((subtotal + tax + shippingCost + platformFee - discount) * 100) / 100;
    if (grandTotal < 0) {
      throw new ClientError('The discount cannot be larger than the order total.');
    }

    return { discount, tax, shippingCost, platformFee, grandTotal };
  }

  async getSummary(ctx: CheckoutContext, adjustments: CheckoutAdjustmentsModel): Promise<CheckoutSummaryDto> {
    const cart = await this.requireCart(ctx);
    const { discount, tax, shippingCost, platformFee, grandTotal } = this.totalsFrom(cart, adjustments);

    return {
      subtotal: cart.totalAmount,
      discount,
      tax,
      shippingCost,
      platformFee,
      grandTotal,
      currency: GATEWAY_CURRENCY,
      itemCount: cart.itemCount,
      totalQuantity: cart.totalQuantity,
    };
  }

  async createRazorpayOrder(ctx: CheckoutContext, adjustments: CheckoutAdjustmentsModel): Promise<RazorpayOrderDto> {
    const cart = await this.requireCart(ctx);
    const { grandTotal } = this.totalsFrom(cart, adjustments);

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
    const { discount, tax, shippingCost, platformFee, grandTotal } = this.totalsFrom(cart, model);

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

    // One transaction for all three writes: a paid gateway charge must never end up as an
    // order with no payment row, or a cleared cart with no order. The unique index on
    // `transactionId` doubles as the idempotency gate for two concurrent verifies.
    try {
      return await this.unitOfWork.transaction(async (transactionClient) => {
        const order = await this.orderService.create(
          {
            customerId: model.customerId,
            discount,
            tax,
            shippingCost: shippingCost + platformFee,
            notes: model.notes ?? null,
            // Paid up front, so the order does not sit in PENDING awaiting money.
            status: OrderStatus.CONFIRMED,
            // The cart is already variant-keyed, so the chosen size/colour carries through to the
            // order line instead of being flattened back to the product.
            items: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          },
          ctx.storeCode,
          ctx.userId,
          ctx.userName,
          transactionClient
        );

        const payment = await this.unitOfWork.Payment.create(
          {
            orderId: order.id,
            storeCode: ctx.storeCode,
            amount: order.grandTotal,
            method: PaymentMethod.ONLINE,
            status: PaymentStatus.PAID,
            transactionId: razorpay_payment_id,
            remarks: `Razorpay ${razorpay_order_id}`,
          },
          transactionClient
        );

        await this.unitOfWork.Cart.clearItems(cart.id, transactionClient);

        return { order, payment, alreadyProcessed: false };
      });
    } catch (error) {
      // A concurrent verify won the race: its payment row owns the transactionId, so hand
      // back the order it created instead of a 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const winner = await this.unitOfWork.Payment.findByTransactionId(razorpay_payment_id);
        const winnerOrder = winner && (await this.unitOfWork.Order.findById(winner.orderId));
        if (winner && winnerOrder) return { order: winnerOrder, payment: winner, alreadyProcessed: true };
      }
      throw error;
    }
  }

  async checkoutDirect(ctx: CheckoutContext, model: DirectCheckoutModel): Promise<CheckoutResultDto> {
    const cart = await this.requireCart(ctx);
    const { discount, tax, shippingCost, platformFee } = this.totalsFrom(cart, model);
    const paidInCash = model.settlement === 'cash';

    // Same atomicity rule as the gateway path: the order, its settlement record and the
    // cart-clear land together or not at all.
    return this.unitOfWork.transaction(async (transactionClient) => {
      const order = await this.orderService.create(
        {
          customerId: model.customerId,
          discount,
          tax,
          shippingCost: shippingCost + platformFee,
          notes: model.notes ?? null,
          // Cash settles on the spot, so the order is confirmed; udhari (credit) has no money
          // moved yet and stays PENDING until it is settled from the order.
          status: paidInCash ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          // The cart is already variant-keyed, so the chosen size/colour carries through to the
          // order line instead of being flattened back to the product.
          items: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        },
        ctx.storeCode,
        ctx.userId,
        ctx.userName,
        transactionClient
      );

      // Cash is money in hand, recorded paid. Udhari files a PAY_LATER payment that stays
      // PENDING, so the order carries how it will be settled instead of looking unpaid by accident.
      const payment = await this.unitOfWork.Payment.create(
        {
          orderId: order.id,
          storeCode: ctx.storeCode,
          amount: order.grandTotal,
          method: paidInCash ? PaymentMethod.CASH : PaymentMethod.PAY_LATER,
          status: paidInCash ? PaymentStatus.PAID : PaymentStatus.PENDING,
          transactionId: null,
          remarks: paidInCash ? 'Cash taken at checkout' : 'Udhari - to be settled',
        },
        transactionClient
      );

      await this.unitOfWork.Cart.clearItems(cart.id, transactionClient);

      return { order, payment, alreadyProcessed: false };
    });
  }
}
