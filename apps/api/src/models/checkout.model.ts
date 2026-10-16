/**
 * Operator-entered adjustments. Item prices are never accepted from the client -
 * they are resolved from the cart and the price history on the server.
 */
export interface CheckoutAdjustmentsModel {
  discount?: number;
  /** Omitted fields fall back to the cart's computed charges (CartDto.charges). */
  tax?: number;
  shippingCost?: number;
  platformFee?: number;
}

/** Shared by both checkout paths. */
export interface CheckoutModel extends CheckoutAdjustmentsModel {
  /** The customer the order is placed for. */
  customerId: string;
  notes?: string | null;
}

/**
 * Body for a direct (no gateway) checkout. Carries no payment fields: like the
 * POS screen, this records the order only and takes no money.
 */
export interface DirectCheckoutModel extends CheckoutModel {
  /**
   * How the money is settled. 'cash' records a paid CASH payment and confirms the order;
   * 'credit' (udhari, the default) places it unpaid to be settled later from the order.
   */
  settlement?: 'cash' | 'credit';
}

/**
 * Body for completing an online checkout. The three razorpay_* fields are exactly
 * what the checkout widget hands back to its `handler` callback.
 */
export interface VerifyRazorpayPaymentModel extends CheckoutModel {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
