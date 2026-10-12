import { ContactMessageDto, ContactMessageFilterParams, CreateContactMessageModel } from "@pms/types";
import { ContactMessageStatus } from "@prisma/client";
import { ListResponseDto } from "../../dtos/list-response.dto";

export interface IContactMessageService {
  create(data: CreateContactMessageModel, storeCode?: string): Promise<ContactMessageDto>;
  getAll(filters?: ContactMessageFilterParams): Promise<ListResponseDto<ContactMessageDto>>;
  getById(id: number): Promise<ContactMessageDto>;
  updateStatus(id: number, status: ContactMessageStatus): Promise<ContactMessageDto>;
  delete(id: number): Promise<ContactMessageDto>;
}
