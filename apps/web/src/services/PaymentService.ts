import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreatePaymentModel, CustomResponse as Response, PaymentDto, UpdatePaymentModel } from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IPaymentService from './interfaces/IPaymentService';

@injectable()
export default class PaymentService implements IPaymentService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: CreatePaymentModel): Promise<AxiosResponse<Response<PaymentDto>>> {
    return this.httpService.call().post<PaymentDto, AxiosResponse<Response<PaymentDto>>>('/payments', model);
  }

  getByOrderId(orderId: number | string): Promise<AxiosResponse<Response<PaymentDto[]>>> {
    return this.httpService.call().get<PaymentDto[], AxiosResponse<Response<PaymentDto[]>>>(`/payments/order/${orderId}`);
  }

  getById(id: number | string): Promise<AxiosResponse<Response<PaymentDto>>> {
    return this.httpService.call().get<PaymentDto, AxiosResponse<Response<PaymentDto>>>(`/payments/${id}`);
  }

  update(id: number | string, model: UpdatePaymentModel): Promise<AxiosResponse<Response<PaymentDto>>> {
    return this.httpService.call().put<PaymentDto, AxiosResponse<Response<PaymentDto>>>(`/payments/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<PaymentDto>>> {
    return this.httpService.call().delete<PaymentDto, AxiosResponse<Response<PaymentDto>>>(`/payments/${id}`);
  }
}
