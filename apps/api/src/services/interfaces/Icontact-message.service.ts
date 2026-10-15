import { ContactMessageDto, ContactMessageFilterParams, CreateContactMessageModel, ListResponseDto } from "@pms/types";
import { ContactMessageStatus } from "@prisma/client";

export interface IContactMessageService {
  create(data: CreateContactMessageModel, storeCode?: string): Promise<ContactMessageDto>;
  getAll(filters?: ContactMessageFilterParams): Promise<ListResponseDto<ContactMessageDto>>;
  getById(id: number): Promise<ContactMessageDto>;
  updateStatus(id: number, status: ContactMessageStatus): Promise<ContactMessageDto>;
  delete(id: number): Promise<ContactMessageDto>;
}
