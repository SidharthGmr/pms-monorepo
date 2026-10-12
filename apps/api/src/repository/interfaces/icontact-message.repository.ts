import { ContactMessageDto, ContactMessageFilterParams } from "@pms/types";
import { ContactMessageStatus } from "@prisma/client";
import { ListResponseDto } from "../../dtos/list-response.dto";

export interface IContactMessageRepository {
  findAll(filters?: ContactMessageFilterParams): Promise<ListResponseDto<ContactMessageDto>>;
  findById(id: number): Promise<ContactMessageDto | null>;
  updateStatus(id: number, status: ContactMessageStatus): Promise<ContactMessageDto>;
  delete(id: number): Promise<ContactMessageDto>;
}
