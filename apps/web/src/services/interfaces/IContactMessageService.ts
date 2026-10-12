import { ContactMessageDto, ContactMessageFilterParams, CreateContactMessageModel, UpdateContactMessageStatusModel } from '@pms/types';
import { AxiosResponse } from 'axios';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

export default interface IContactMessageService {
  createPublic(model: CreateContactMessageModel): Promise<AxiosResponse<Response<ContactMessageDto>>>;
  getAll(params?: ContactMessageFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ContactMessageDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<ContactMessageDto>>>;
  updateStatus(id: number | string, model: UpdateContactMessageStatusModel): Promise<AxiosResponse<Response<ContactMessageDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<ContactMessageDto>>>;
}
