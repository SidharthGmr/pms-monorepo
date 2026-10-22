import { CustomResponse as Response, CreateSubscriberModel, ListResponseDto, SubscriberDto, SubscriberFilterParams } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface ISubscriberService {
  subscribePublic(model: CreateSubscriberModel): Promise<AxiosResponse<Response<SubscriberDto>>>;
  getAll(params?: SubscriberFilterParams): Promise<AxiosResponse<Response<ListResponseDto<SubscriberDto>>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<SubscriberDto>>>;
}
