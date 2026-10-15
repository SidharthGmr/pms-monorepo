import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  ContactMessageDto,
  ContactMessageFilterParams,
  CreateContactMessageModel,
  CustomResponse as Response,
  ListResponseDto,
  UpdateContactMessageStatusModel,
} from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IContactMessageService from './interfaces/IContactMessageService';
import IHttpService from './interfaces/IHttpService';

@injectable()
export default class ContactMessageService implements IContactMessageService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  // The form is public: externalCall() keeps the clientId gate but sends no bearer token, so a
  // logged-out visitor is never dragged through the 401 refresh/sign-out interceptor.
  createPublic(model: CreateContactMessageModel): Promise<AxiosResponse<Response<ContactMessageDto>>> {
    return this.httpService.externalCall().post<ContactMessageDto, AxiosResponse<Response<ContactMessageDto>>>('/contact-messages/public', model);
  }

  getAll(params?: ContactMessageFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ContactMessageDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<ContactMessageDto>, AxiosResponse<Response<ListResponseDto<ContactMessageDto>>>>('/contact-messages', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<ContactMessageDto>>> {
    return this.httpService.call().get<ContactMessageDto, AxiosResponse<Response<ContactMessageDto>>>(`/contact-messages/${id}`);
  }

  updateStatus(id: number | string, model: UpdateContactMessageStatusModel): Promise<AxiosResponse<Response<ContactMessageDto>>> {
    return this.httpService.call().patch<ContactMessageDto, AxiosResponse<Response<ContactMessageDto>>>(`/contact-messages/${id}/status`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<ContactMessageDto>>> {
    return this.httpService.call().delete<ContactMessageDto, AxiosResponse<Response<ContactMessageDto>>>(`/contact-messages/${id}`);
  }
}
