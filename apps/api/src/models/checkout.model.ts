/**
 * Operator-entered adjustments. Item prices are never accepted from the client -
 * they are resolved from the cart and the price history on the server.
 */
export interface CheckoutAdjustmentsModel {
  discount?: number;
  tax?: number;
  shippingCost?: number;
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
export interface DirectCheckoutModel extends CheckoutModel { }

/**
 * Body for completing an online checkout. The three razorpay_* fields are exactly
 * what the checkout widget hands back to its `handler` callback.
 */
export interface VerifyRazorpayPaymentModel extends CheckoutModel {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
