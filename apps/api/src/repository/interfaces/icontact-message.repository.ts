import { ContactMessageDto, ContactMessageFilterParams, ListResponseDto } from "@pms/types";
import { ContactMessageStatus } from "@prisma/client";

export interface IContactMessageRepository {
  findAll(filters?: ContactMessageFilterParams): Promise<ListResponseDto<ContactMessageDto>>;
  findById(id: number): Promise<ContactMessageDto | null>;
  updateStatus(id: number, status: ContactMessageStatus): Promise<ContactMessageDto>;
  delete(id: number): Promise<ContactMessageDto>;
}
