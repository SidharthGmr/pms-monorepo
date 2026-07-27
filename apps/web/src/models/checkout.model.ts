/** Operator-entered adjustments. Item prices always come from the server. */
export interface CheckoutAdjustmentsModel {
  discount?: number;
  tax?: number;
  shippingCost?: number;
}

export interface CheckoutModel extends CheckoutAdjustmentsModel {
  customerId: string;
  notes?: string | null;
}

/**
 * Body for POST /checkout/direct. No payment is taken and no payment row is
 * written - the order is created exactly as the POS screen creates it.
 */
export interface DirectCheckoutModel extends CheckoutModel { }

/**
 * Body for POST /checkout/razorpay/payments/verify. The three razorpay_* fields
 * come straight from the widget's handler callback.
 */
export interface VerifyRazorpayPaymentModel extends CheckoutModel {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
