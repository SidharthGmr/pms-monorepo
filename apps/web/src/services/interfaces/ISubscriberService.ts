import { CreateSubscriberModel, SubscriberDto, SubscriberFilterParams } from '@pms/types';
import { AxiosResponse } from 'axios';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

export default interface ISubscriberService {
  subscribePublic(model: CreateSubscriberModel): Promise<AxiosResponse<Response<SubscriberDto>>>;
  getAll(params?: SubscriberFilterParams): Promise<AxiosResponse<Response<ListResponseDto<SubscriberDto>>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<SubscriberDto>>>;
}
