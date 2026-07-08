import { OrderItemDto } from '@/dtos/order-item.dto';
import Response from '@/dtos/Response';
import { CreateOrderItemModel, UpdateOrderItemModel } from '@/models/order-item.model';
import { AxiosResponse } from 'axios';

export default interface IOrderItemService {
  create(model: CreateOrderItemModel): Promise<AxiosResponse<Response<OrderItemDto>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<OrderItemDto>>>;
  getByOrderId(orderId: number): Promise<AxiosResponse<Response<OrderItemDto[]>>>;
  update(id: number | string, model: UpdateOrderItemModel): Promise<AxiosResponse<Response<OrderItemDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
