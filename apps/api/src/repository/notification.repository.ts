import { ListResponseDto, NotificationDto, NotificationFilterParams, NotificationType, CreateNotificationModel } from '@pms/types';
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

import { INotificationRepository } from "./interfaces/inotification.repository";

const SORTABLE_COLUMNS = new Set(['type', 'title', 'isRead', 'createdAt', 'id']);

export const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  link: true,
  isRead: true,
  readAt: true,
  metadata: true,
  // storeCode and recipientId are withheld from responses, like every other entity.
  createdAt: true,
} satisfies Prisma.NotificationSelect;

const toDto = (row: Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>): NotificationDto => ({
  ...row,
  metadata: (row.metadata as Record<string, unknown> | null) ?? null,
});

export class NotificationRepository implements INotificationRepository {
  async createMany(notifications: CreateNotificationModel[]): Promise<number> {
    if (notifications.length === 0) return 0;

    const result = await prisma.notification.createMany({
      data: notifications.map((item) => ({
        storeCode: item.storeCode,
        recipientId: item.recipientId,
        type: item.type,
        title: item.title,
        message: item.message,
        link: item.link ?? null,
        metadata: (item.metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      })),
    });
    return result.count;
  }

  async findAll(recipientId: string, filters?: NotificationFilterParams): Promise<ListResponseDto<NotificationDto>> {
    const where: Prisma.NotificationWhereInput = { recipientId };
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.recordPerPage && filters.recordPerPage > 0 ? filters.recordPerPage : 10;

    if (filters) {
      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.isRead != null) {
        where.isRead = filters.isRead;
      }

      if (filters.search) {
        const match = { contains: filters.search, mode: 'insensitive' as const };
        where.OR = [{ title: match }, { message: match }];
      }

      if (filters.startDate !== undefined || filters.endDate !== undefined) {
        where.createdAt = {
          ...(filters.startDate != null && { gte: new Date(filters.startDate) }),
          ...(filters.endDate != null && { lte: new Date(filters.endDate) }),
        };
      }
    }

    const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
    const direction: Prisma.SortOrder = String(filters?.sortDirection ?? '').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const showAll = filters?.showAllRecords === true;

    const [data, totalRecord] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(showAll ? {} : { skip: (page - 1) * limit, take: limit }),
        select: notificationSelect,
      }),
      prisma.notification.count({ where }),
    ]);

    return { totalRecord, data: data.map(toDto) };
  }

  async countUnread(recipientId: string): Promise<number> {
    return prisma.notification.count({ where: { recipientId, isRead: false } });
  }

  async markRead(recipientId: string, ids?: number[]): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { recipientId, isRead: false, ...(ids && ids.length > 0 ? { id: { in: ids } } : {}) },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }

  async delete(id: number, recipientId: string): Promise<NotificationDto | null> {
    const existing = await prisma.notification.findFirst({ where: { id, recipientId }, select: notificationSelect });
    if (!existing) return null;

    await prisma.notification.delete({ where: { id } });
    return toDto(existing);
  }

  async hasUnread(recipientId: string, type: NotificationType, metadataMatch: Record<string, unknown>): Promise<boolean> {
    const found = await prisma.notification.findFirst({
      where: { recipientId, type, isRead: false, metadata: { equals: metadataMatch as Prisma.InputJsonValue } },
      select: { id: true },
    });
    return found !== null;
  }
}
