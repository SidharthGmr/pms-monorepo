import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { OrderDto } from '@/dtos/order.dto';
import Response from '@/dtos/Response';
import { CreateOrderModel, UpdateOrderModel } from '@/models/order.model';
import { OrderFilterParams } from '@/params/order.params';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IOrderService from './interfaces/IOrderService';

@injectable()
export default class OrderService implements IOrderService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: CreateOrderModel): Promise<AxiosResponse<Response<OrderDto>>> {
    return this.httpService
      .call()
      .post<OrderDto, AxiosResponse<Response<OrderDto>>>('/orders', model);
  }

  getAll(params?: OrderFilterParams): Promise<AxiosResponse<Response<ListResponseDto<OrderDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<OrderDto>, AxiosResponse<Response<ListResponseDto<OrderDto>>>>('/orders', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<OrderDto>>> {
    return this.httpService
      .call()
      .get<OrderDto, AxiosResponse<Response<OrderDto>>>(`/orders/${id}`);
  }

  getByCustomerId(customerId: string, params?: OrderFilterParams): Promise<AxiosResponse<Response<ListResponseDto<OrderDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<OrderDto>, AxiosResponse<Response<ListResponseDto<OrderDto>>>>(`/orders/customer/${customerId}`, { params });
  }

  update(id: number | string, model: UpdateOrderModel): Promise<AxiosResponse<Response<OrderDto>>> {
    return this.httpService
      .call()
      .put<OrderDto, AxiosResponse<Response<OrderDto>>>(`/orders/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService
      .call()
      .delete<void, AxiosResponse<Response<void>>>(`/orders/${id}`);
  }
}
