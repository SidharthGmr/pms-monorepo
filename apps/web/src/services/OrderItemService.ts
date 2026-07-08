import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { OrderItemDto } from '@/dtos/order-item.dto';
import Response from '@/dtos/Response';
import { CreateOrderItemModel, UpdateOrderItemModel } from '@/models/order-item.model';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IOrderItemService from './interfaces/IOrderItemService';

@injectable()
export default class OrderItemService implements IOrderItemService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: CreateOrderItemModel): Promise<AxiosResponse<Response<OrderItemDto>>> {
    return this.httpService
      .call()
      .post<OrderItemDto, AxiosResponse<Response<OrderItemDto>>>('/order-items', model);
  }

  getById(id: number | string): Promise<AxiosResponse<Response<OrderItemDto>>> {
    return this.httpService
      .call()
      .get<OrderItemDto, AxiosResponse<Response<OrderItemDto>>>(`/order-items/${id}`);
  }

  getByOrderId(orderId: number): Promise<AxiosResponse<Response<OrderItemDto[]>>> {
    return this.httpService
      .call()
      .get<OrderItemDto[], AxiosResponse<Response<OrderItemDto[]>>>(`/order-items/order/${orderId}`);
  }

  update(id: number | string, model: UpdateOrderItemModel): Promise<AxiosResponse<Response<OrderItemDto>>> {
    return this.httpService
      .call()
      .put<OrderItemDto, AxiosResponse<Response<OrderItemDto>>>(`/order-items/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService
      .call()
      .delete<void, AxiosResponse<Response<void>>>(`/order-items/${id}`);
  }
}
