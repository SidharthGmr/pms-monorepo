import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateSubscriberModel, CustomResponse as Response, ListResponseDto, SubscriberDto, SubscriberFilterParams } from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import ISubscriberService from './interfaces/ISubscriberService';

@injectable()
export default class SubscriberService implements ISubscriberService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  // Public signup: externalCall() keeps the clientId gate but sends no bearer token.
  subscribePublic(model: CreateSubscriberModel): Promise<AxiosResponse<Response<SubscriberDto>>> {
    return this.httpService
      .externalCall()
      .post<SubscriberDto, AxiosResponse<Response<SubscriberDto>>>('/subscribers/public', model);
  }

  getAll(params?: SubscriberFilterParams): Promise<AxiosResponse<Response<ListResponseDto<SubscriberDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<SubscriberDto>, AxiosResponse<Response<ListResponseDto<SubscriberDto>>>>('/subscribers', { params });
  }

  delete(id: number | string): Promise<AxiosResponse<Response<SubscriberDto>>> {
    return this.httpService
      .call()
      .delete<SubscriberDto, AxiosResponse<Response<SubscriberDto>>>(`/subscribers/${id}`);
  }
}
