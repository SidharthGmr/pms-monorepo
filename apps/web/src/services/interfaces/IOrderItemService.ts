
import { CustomResponse as Response, OrderItemDto, CreateOrderItemModel, UpdateOrderItemModel } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IOrderItemService {
  create(model: CreateOrderItemModel): Promise<AxiosResponse<Response<OrderItemDto>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<OrderItemDto>>>;
  getByOrderId(orderId: number): Promise<AxiosResponse<Response<OrderItemDto[]>>>;
  update(id: number | string, model: UpdateOrderItemModel): Promise<AxiosResponse<Response<OrderItemDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
