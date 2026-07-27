import { CheckoutResultDto, CheckoutSummaryDto, RazorpayOrderDto } from '@/dtos/checkout.dto';
import Response from '@/dtos/Response';
import { CheckoutAdjustmentsModel, DirectCheckoutModel, VerifyRazorpayPaymentModel } from '@/models/checkout.model';
import { AxiosResponse } from 'axios';

export default interface ICheckoutService {
  /** Server-computed totals for the active cart plus the given adjustments. */
  getSummary(adjustments?: CheckoutAdjustmentsModel): Promise<AxiosResponse<Response<CheckoutSummaryDto>>>;

  /** Opens a Razorpay order. The amount is derived from the cart server-side. */
  createRazorpayOrder(adjustments?: CheckoutAdjustmentsModel): Promise<AxiosResponse<Response<RazorpayOrderDto>>>;

  /** Verifies the gateway response and places the order. */
  verifyRazorpayPayment(model: VerifyRazorpayPaymentModel): Promise<AxiosResponse<Response<CheckoutResultDto>>>;

  /** Places the order without taking payment. */
  checkoutDirect(model: DirectCheckoutModel): Promise<AxiosResponse<Response<CheckoutResultDto>>>;
}
