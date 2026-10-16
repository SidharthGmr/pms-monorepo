import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CheckoutResultDto, CheckoutSummaryDto, RazorpayOrderDto } from '../dtos/checkout.dto';
import { CustomResponse } from '@pms/types';
import { Role } from '../enum/user.enum';
import { CheckoutAdjustmentsModel, DirectCheckoutModel, VerifyRazorpayPaymentModel } from '../models/checkout.model';
import IUnitOfService from '../services/interfaces/iunitof.service';
import { CheckoutContext } from '../services/interfaces/Icheckout.service';

export class CheckoutController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  /**
   * Checkout always acts on the caller's own cart and store, both taken from the
   * token - never from the body - so one operator cannot check out another's cart.
   */
  private async buildContext(req: Request): Promise<{ ctx?: CheckoutContext; error?: string }> {
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId as string | undefined;

    if (!storeCode || !userId) {
      return { error: 'Store code not found. User must be associated with a store.' };
    }

    const store = await this.unitOfService.Store.getByCode(storeCode);
    if (!store) return { error: `No store found for code ${storeCode}.` };

    return {
      ctx: {
        owner: { storeId: store.id, userId, sessionToken: null },
        storeCode,
        userId,
        userName: (req.user?.name as string | undefined) ?? '',
      },
    };
  }

  // Discounts and charge overrides are an operator tool. A customer checks out at the
  // store-computed charges, whatever their request claims.
  private adjustmentsFor(req: Request, source: any): CheckoutAdjustmentsModel {
    return req.user?.role === Role.USER ? {} : this.adjustmentsFrom(source);
  }

  private adjustmentsFrom(body: any): CheckoutAdjustmentsModel {
    return {
      ...(body?.discount !== undefined && { discount: Number(body.discount) }),
      ...(body?.tax !== undefined && { tax: Number(body.tax) }),
      ...(body?.shippingCost !== undefined && { shippingCost: Number(body.shippingCost) }),
      ...(body?.platformFee !== undefined && { platformFee: Number(body.platformFee) }),
    };
  }

  getSummary = async (req: Request, res: Response): Promise<Response<CustomResponse<CheckoutSummaryDto>>> => {
    const { ctx, error } = await this.buildContext(req);
    if (!ctx) return res.status(400).json({ success: false, message: error });

    const adjustments = this.adjustmentsFor(req, req.query);
    const summary = await this.unitOfService.Checkout.getSummary(ctx, adjustments);
    return res.status(200).json({ success: true, message: 'Checkout summary fetched successfully', data: summary });
  };

  createRazorpayOrder = async (req: Request, res: Response): Promise<Response<CustomResponse<RazorpayOrderDto>>> => {
    const { ctx, error } = await this.buildContext(req);
    if (!ctx) return res.status(400).json({ success: false, message: error });

    // The amount is intentionally ignored if the client sends one; it is derived
    // from the persisted cart so it cannot be tampered with.
    const order = await this.unitOfService.Checkout.createRazorpayOrder(ctx, this.adjustmentsFor(req, req.body));
    return res.status(201).json({ success: true, message: 'Payment order created successfully', data: order });
  };

  // A customer checks out their own account - whatever customerId the body claims. Staff and
  // admins place orders for the customer they picked.
  private resolveCustomerId = (req: Request, bodyCustomerId: string | undefined): string | undefined =>
    req.user?.role === Role.USER ? (req.user?.userId as string | undefined) : bodyCustomerId;

  verifyRazorpayPayment = async (req: Request, res: Response): Promise<Response<CustomResponse<CheckoutResultDto>>> => {
    const { ctx, error } = await this.buildContext(req);
    if (!ctx) return res.status(400).json({ success: false, message: error });

    const body = req.body as Partial<VerifyRazorpayPaymentModel>;
    const customerId = this.resolveCustomerId(req, body.customerId);
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required.' });
    }

    const model: VerifyRazorpayPaymentModel = {
      customerId,
      notes: body.notes ?? null,
      razorpay_order_id: body.razorpay_order_id ?? '',
      razorpay_payment_id: body.razorpay_payment_id ?? '',
      razorpay_signature: body.razorpay_signature ?? '',
      ...this.adjustmentsFor(req, body),
    };

    const result = await this.unitOfService.Checkout.completeRazorpayCheckout(ctx, model);
    return res.status(201).json({
      success: true,
      message: result.alreadyProcessed ? 'This payment was already recorded' : 'Payment verified and order placed successfully',
      data: result,
    });
  };

  checkoutDirect = async (req: Request, res: Response): Promise<Response<CustomResponse<CheckoutResultDto>>> => {
    const { ctx, error } = await this.buildContext(req);
    if (!ctx) return res.status(400).json({ success: false, message: error });

    const body = req.body as Partial<DirectCheckoutModel>;
    const customerId = this.resolveCustomerId(req, body.customerId);
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required.' });
    }

    const model: DirectCheckoutModel = {
      customerId,
      notes: body.notes ?? null,
      // A customer cannot mark their own order as cash-paid; that is the operator's call.
      settlement: req.user?.role !== Role.USER && body.settlement === 'cash' ? 'cash' : 'credit',
      ...this.adjustmentsFor(req, body),
    };

    const result = await this.unitOfService.Checkout.checkoutDirect(ctx, model);
    return res.status(201).json({ success: true, message: 'Order placed successfully', data: result });
  };
}
