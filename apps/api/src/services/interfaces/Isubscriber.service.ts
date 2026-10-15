import { ListResponseDto, SubscriberDto, SubscriberFilterParams } from "@pms/types";

export interface ISubscriberService {
  /** Returns the row plus whether this call created or revived it, so the API can answer honestly. */
  subscribe(email: string, storeCode?: string): Promise<{ subscriber: SubscriberDto; already: boolean }>;
  getAll(filters?: SubscriberFilterParams): Promise<ListResponseDto<SubscriberDto>>;
  delete(id: number): Promise<SubscriberDto>;
}
