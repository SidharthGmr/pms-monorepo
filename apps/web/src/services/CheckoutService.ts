import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CheckoutResultDto, CheckoutSummaryDto, RazorpayOrderDto } from '@/dtos/checkout.dto';
import Response from '@/dtos/Response';
import { CheckoutAdjustmentsModel, DirectCheckoutModel, VerifyRazorpayPaymentModel } from '@/models/checkout.model';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import ICheckoutService from './interfaces/ICheckoutService';
import IHttpService from './interfaces/IHttpService';

@injectable()
export default class CheckoutService implements ICheckoutService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  getSummary(adjustments?: CheckoutAdjustmentsModel): Promise<AxiosResponse<Response<CheckoutSummaryDto>>> {
    return this.httpService
      .call()
      .get<CheckoutSummaryDto, AxiosResponse<Response<CheckoutSummaryDto>>>('/checkout/summary', { params: adjustments });
  }

  createRazorpayOrder(adjustments?: CheckoutAdjustmentsModel): Promise<AxiosResponse<Response<RazorpayOrderDto>>> {
    return this.httpService
      .call()
      .post<RazorpayOrderDto, AxiosResponse<Response<RazorpayOrderDto>>>('/checkout/razorpay/orders', adjustments ?? {});
  }

  verifyRazorpayPayment(model: VerifyRazorpayPaymentModel): Promise<AxiosResponse<Response<CheckoutResultDto>>> {
    return this.httpService
      .call()
      .post<CheckoutResultDto, AxiosResponse<Response<CheckoutResultDto>>>('/checkout/razorpay/payments/verify', model);
  }

  checkoutDirect(model: DirectCheckoutModel): Promise<AxiosResponse<Response<CheckoutResultDto>>> {
    return this.httpService.call().post<CheckoutResultDto, AxiosResponse<Response<CheckoutResultDto>>>('/checkout/direct', model);
  }
}
