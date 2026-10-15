import { ListResponseDto, SubscriberDto, SubscriberFilterParams } from "@pms/types";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ISubscriberRepository } from "./interfaces/isubscriber.repository";

const SORTABLE_COLUMNS = new Set(['email', 'createdAt', 'unsubscribedAt', 'id']);

export const subscriberSelect = {
  id: true,
  email: true,
  createdAt: true,
  unsubscribedAt: true,
} satisfies Prisma.SubscriberSelect;

export class SubscriberRepository implements ISubscriberRepository {
  async findAll(filters?: SubscriberFilterParams): Promise<ListResponseDto<SubscriberDto>> {
    const where: Prisma.SubscriberWhereInput = {};
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.recordPerPage && filters.recordPerPage > 0 ? filters.recordPerPage : 10;

    if (filters) {
      if (filters.search) {
        where.email = { contains: filters.search, mode: 'insensitive' };
      }
      if (filters.active === true) {
        where.unsubscribedAt = null;
      } else if (filters.active === false) {
        where.unsubscribedAt = { not: null };
      }
    }

    const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
    const direction: Prisma.SortOrder = String(filters?.sortDirection ?? '').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const showAll = filters?.showAllRecords === true;

    const [data, totalRecord] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(showAll ? {} : { skip: (page - 1) * limit, take: limit }),
        select: subscriberSelect,
      }),
      prisma.subscriber.count({ where }),
    ]);

    return { totalRecord, data };
  }

  async findById(id: number): Promise<SubscriberDto | null> {
    return prisma.subscriber.findUnique({ where: { id }, select: subscriberSelect });
  }

  async findByEmail(email: string): Promise<SubscriberDto | null> {
    return prisma.subscriber.findUnique({ where: { email }, select: subscriberSelect });
  }

  async delete(id: number): Promise<SubscriberDto> {
    return prisma.subscriber.delete({ where: { id }, select: subscriberSelect });
  }
}
