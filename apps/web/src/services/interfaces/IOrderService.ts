import { ListResponseDto } from '@/dtos/list-response.dto';
import { OrderDto } from '@/dtos/order.dto';
import Response from '@/dtos/Response';
import { CreateOrderModel, UpdateOrderModel } from '@/models/order.model';
import { OrderFilterParams } from '@/params/order.params';
import { AxiosResponse } from 'axios';

export default interface IOrderService {
  create(model: CreateOrderModel): Promise<AxiosResponse<Response<OrderDto>>>;
  getAll(params?: OrderFilterParams): Promise<AxiosResponse<Response<ListResponseDto<OrderDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<OrderDto>>>;
  getByCustomerId(customerId: string, params?: OrderFilterParams): Promise<AxiosResponse<Response<ListResponseDto<OrderDto>>>>;
  update(id: number | string, model: UpdateOrderModel): Promise<AxiosResponse<Response<OrderDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
