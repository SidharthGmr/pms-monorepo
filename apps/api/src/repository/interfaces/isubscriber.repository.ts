import { SubscriberDto, SubscriberFilterParams } from "@pms/types";
import { ListResponseDto } from "../../dtos/list-response.dto";

export interface ISubscriberRepository {
  findAll(filters?: SubscriberFilterParams): Promise<ListResponseDto<SubscriberDto>>;
  findById(id: number): Promise<SubscriberDto | null>;
  findByEmail(email: string): Promise<SubscriberDto | null>;
  delete(id: number): Promise<SubscriberDto>;
}
