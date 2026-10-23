import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  CustomResponse as Response,
  ListResponseDto,
  OrderReturnDto,
  OrderReturnFilterParams,
  OrderReturnModel,
  OrderReturnStatusModel,
  ReturnedQuantityDto,
} from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IOrderReturnService from './interfaces/IOrderReturnService';

@injectable()
export default class OrderReturnService implements IOrderReturnService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: OrderReturnModel): Promise<AxiosResponse<Response<OrderReturnDto>>> {
    return this.httpService.call().post<OrderReturnDto, AxiosResponse<Response<OrderReturnDto>>>('/order-returns', model);
  }

  getAll(params?: OrderReturnFilterParams): Promise<AxiosResponse<Response<ListResponseDto<OrderReturnDto>>>> {
    return this.httpService.call().get<ListResponseDto<OrderReturnDto>, AxiosResponse<Response<ListResponseDto<OrderReturnDto>>>>('/order-returns', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<OrderReturnDto>>> {
    return this.httpService.call().get<OrderReturnDto, AxiosResponse<Response<OrderReturnDto>>>(`/order-returns/${id}`);
  }

  update(id: number | string, model: OrderReturnModel): Promise<AxiosResponse<Response<OrderReturnDto>>> {
    return this.httpService.call().put<OrderReturnDto, AxiosResponse<Response<OrderReturnDto>>>(`/order-returns/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<OrderReturnDto>>> {
    return this.httpService.call().delete<OrderReturnDto, AxiosResponse<Response<OrderReturnDto>>>(`/order-returns/${id}`);
  }

  updateStatus(id: number | string, model: OrderReturnStatusModel): Promise<AxiosResponse<Response<OrderReturnDto>>> {
    return this.httpService.call().patch<OrderReturnDto, AxiosResponse<Response<OrderReturnDto>>>(`/order-returns/${id}/status`, model);
  }

  getReturnedQuantities(orderId: number | string): Promise<AxiosResponse<Response<ReturnedQuantityDto[]>>> {
    return this.httpService.call().get<ReturnedQuantityDto[], AxiosResponse<Response<ReturnedQuantityDto[]>>>(`/order-returns/returned-quantities/${orderId}`);
  }

  getByCustomerId(customerId: string): Promise<AxiosResponse<Response<ListResponseDto<OrderReturnDto>>>> {
    return this.httpService.call().get<ListResponseDto<OrderReturnDto>, AxiosResponse<Response<ListResponseDto<OrderReturnDto>>>>(`/order-returns/customer/${customerId}`);
  }
}
