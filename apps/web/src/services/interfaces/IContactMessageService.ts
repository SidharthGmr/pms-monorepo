import {
  ContactMessageDto,
  ContactMessageFilterParams,
  CreateContactMessageModel,
  CustomResponse as Response,
  ListResponseDto,
  UpdateContactMessageStatusModel,
} from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IContactMessageService {
  createPublic(model: CreateContactMessageModel): Promise<AxiosResponse<Response<ContactMessageDto>>>;
  getAll(params?: ContactMessageFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ContactMessageDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<ContactMessageDto>>>;
  updateStatus(id: number | string, model: UpdateContactMessageStatusModel): Promise<AxiosResponse<Response<ContactMessageDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<ContactMessageDto>>>;
}
