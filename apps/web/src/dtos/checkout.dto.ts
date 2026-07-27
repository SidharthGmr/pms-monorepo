import { OrderDto } from './order.dto';

/** Everything needed to open the Razorpay widget. */
export interface RazorpayOrderDto {
  keyId: string;
  /** Razorpay's order id (`order_...`), not the PMS order id. */
  orderId: string;
  /** Amount in paise, as Razorpay expects. */
  amount: number;
  currency: string;
  /** Same amount in rupees, for display. */
  displayAmount: number;
}

export interface CheckoutPaymentDto {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  status: string;
  transactionId?: string | null;
  remarks?: string | null;
}

export interface CheckoutResultDto {
  order: OrderDto;
  payment: CheckoutPaymentDto | null;
  /** True when this gateway payment had already been recorded. */
  alreadyProcessed: boolean;
}

/** Server-computed totals, so the UI never recomputes prices itself. */
export interface CheckoutSummaryDto {
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  currency: string;
  itemCount: number;
  totalQuantity: number;
}
