import { SubscriberDto, SubscriberFilterParams } from "@pms/types";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto } from "../dtos/list-response.dto";
import NotFoundError from "../exceptions/not-found-error";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { subscriberSelect } from "../repository/subscriber.repository";
import { ISubscriberService } from "./interfaces/Isubscriber.service";

@injectable()
export class SubscriberService implements ISubscriberService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  // One address is one row forever: a resubscribe clears unsubscribedAt on the existing row,
  // so the unique key holds and the signup date records the first time they joined.
  async subscribe(email: string, storeCode?: string): Promise<{ subscriber: SubscriberDto; already: boolean }> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.unitOfWork.Subscriber.findByEmail(normalized);

    if (existing && existing.unsubscribedAt == null) {
      return { subscriber: existing, already: true };
    }

    const subscriber = await this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.subscriber.upsert({
        where: { email: normalized },
        create: { email: normalized, ...(storeCode && { storeCode }) },
        update: { unsubscribedAt: null },
        select: subscriberSelect,
      });
    });

    return { subscriber, already: false };
  }

  async getAll(filters?: SubscriberFilterParams): Promise<ListResponseDto<SubscriberDto>> {
    return this.unitOfWork.Subscriber.findAll(filters);
  }

  async delete(id: number): Promise<SubscriberDto> {
    const existing = await this.unitOfWork.Subscriber.findById(id);
    if (!existing) throw new NotFoundError("Subscriber not found");
    return this.unitOfWork.Subscriber.delete(id);
  }
}
