import { CheckoutResultDto, CheckoutSummaryDto, RazorpayOrderDto } from '../../dtos/checkout.dto';
import { CheckoutAdjustmentsModel, DirectCheckoutModel, VerifyRazorpayPaymentModel } from '../../models/checkout.model';
import { CartOwner } from '../../repository/interfaces/icart.repository';

export interface CheckoutContext {
  owner: CartOwner;
  storeCode: string;
  userId: string;
  userName: string;
}

export interface ICheckoutService {
  /** Server-computed totals for the active cart plus the supplied adjustments. */
  getSummary(ctx: CheckoutContext, adjustments: CheckoutAdjustmentsModel): Promise<CheckoutSummaryDto>;

  /**
   * Opens a Razorpay order for the active cart's total. The amount is derived
   * from the cart on the server, never taken from the request.
   */
  createRazorpayOrder(ctx: CheckoutContext, adjustments: CheckoutAdjustmentsModel): Promise<RazorpayOrderDto>;

  /**
   * Verifies the gateway signature and, only if it is genuine, turns the cart
   * into an order plus a PAID payment and empties the cart. Idempotent: a
   * replayed callback returns the original order instead of duplicating it.
   */
  completeRazorpayCheckout(ctx: CheckoutContext, model: VerifyRazorpayPaymentModel): Promise<CheckoutResultDto>;

  /**
   * Places the order with no gateway involved and no payment row, matching what
   * the POS screen does, then empties the cart.
   */
  checkoutDirect(ctx: CheckoutContext, model: DirectCheckoutModel): Promise<CheckoutResultDto>;
}
