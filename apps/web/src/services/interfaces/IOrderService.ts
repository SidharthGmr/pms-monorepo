import { CustomResponse as Response, ListResponseDto, OrderDto, CreateOrderModel, UpdateOrderModel, UpdateOrderStatusModel, OrderFilterParams } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IOrderService {
  create(model: CreateOrderModel): Promise<AxiosResponse<Response<OrderDto>>>;
  getAll(params?: OrderFilterParams): Promise<AxiosResponse<Response<ListResponseDto<OrderDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<OrderDto>>>;
  getByCustomerId(customerId: string, params?: OrderFilterParams): Promise<AxiosResponse<Response<ListResponseDto<OrderDto>>>>;
  update(id: number | string, model: UpdateOrderModel): Promise<AxiosResponse<Response<OrderDto>>>;
  updateStatus(id: number | string, model: UpdateOrderStatusModel): Promise<AxiosResponse<Response<OrderDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
