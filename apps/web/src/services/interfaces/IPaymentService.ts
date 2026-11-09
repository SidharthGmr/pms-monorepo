import { CreatePaymentModel, CustomResponse as Response, PaymentDto, UpdatePaymentModel } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IPaymentService {
  create(model: CreatePaymentModel): Promise<AxiosResponse<Response<PaymentDto>>>;
  getByOrderId(orderId: number | string): Promise<AxiosResponse<Response<PaymentDto[]>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<PaymentDto>>>;
  update(id: number | string, model: UpdatePaymentModel): Promise<AxiosResponse<Response<PaymentDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<PaymentDto>>>;
}
