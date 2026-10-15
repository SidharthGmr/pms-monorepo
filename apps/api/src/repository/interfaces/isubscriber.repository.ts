import { ListResponseDto, SubscriberDto, SubscriberFilterParams } from "@pms/types";

export interface ISubscriberRepository {
  findAll(filters?: SubscriberFilterParams): Promise<ListResponseDto<SubscriberDto>>;
  findById(id: number): Promise<SubscriberDto | null>;
  findByEmail(email: string): Promise<SubscriberDto | null>;
  delete(id: number): Promise<SubscriberDto>;
}
