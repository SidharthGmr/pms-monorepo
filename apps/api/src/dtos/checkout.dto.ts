import { OrderDto } from './order.dto';
import { PaymentDto } from './payment.dto';

/** Everything the browser needs to open the Razorpay checkout widget. */
export interface RazorpayOrderDto {
  /** Publishable key id - safe to send to the browser. */
  keyId: string;
  /** Razorpay's order id (`order_...`), not the PMS order id. */
  orderId: string;
  /** Amount in the smallest currency unit (paise), as Razorpay expects. */
  amount: number;
  currency: string;
  /** Same amount in major units, for display. */
  displayAmount: number;
}

/** Result of a completed checkout, either online or direct. */
export interface CheckoutResultDto {
  order: OrderDto;
  payment: PaymentDto | null;
  /** True when an identical gateway payment had already been captured. */
  alreadyProcessed: boolean;
}

/** Server-computed totals for the current cart, so the UI never guesses. */
export interface CheckoutSummaryDto {
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number
  grandTotal: number;
  currency: string;
  itemCount: number;
  totalQuantity: number;
}
