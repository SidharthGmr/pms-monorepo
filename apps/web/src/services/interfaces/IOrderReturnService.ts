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

export default interface IOrderReturnService {
  create(model: OrderReturnModel): Promise<AxiosResponse<Response<OrderReturnDto>>>;
  getAll(params?: OrderReturnFilterParams): Promise<AxiosResponse<Response<ListResponseDto<OrderReturnDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<OrderReturnDto>>>;
  update(id: number | string, model: OrderReturnModel): Promise<AxiosResponse<Response<OrderReturnDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<OrderReturnDto>>>;
  updateStatus(id: number | string, model: OrderReturnStatusModel): Promise<AxiosResponse<Response<OrderReturnDto>>>;
  getReturnedQuantities(orderId: number | string): Promise<AxiosResponse<Response<ReturnedQuantityDto[]>>>;
  getByCustomerId(customerId: string): Promise<AxiosResponse<Response<ListResponseDto<OrderReturnDto>>>>;
}
