import { ContactMessageDto, ContactMessageFilterParams, ListResponseDto } from "@pms/types";
import { ContactMessageStatus, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { IContactMessageRepository } from "./interfaces/icontact-message.repository";

const SORTABLE_COLUMNS = new Set(['name', 'email', 'subject', 'status', 'createdAt', 'updatedAt', 'id']);

export const contactMessageSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  subject: true,
  message: true,
  status: true,
  // storeCode is withheld from responses, like every other entity.
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ContactMessageSelect;

export class ContactMessageRepository implements IContactMessageRepository {
  async findAll(filters?: ContactMessageFilterParams): Promise<ListResponseDto<ContactMessageDto>> {
    const where: Prisma.ContactMessageWhereInput = {};
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.recordPerPage && filters.recordPerPage > 0 ? filters.recordPerPage : 10;

    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }

      // The form has no store context, so a message without a storeCode is site-wide and
      // every store's admin sees it alongside their own.
      if (filters.storeCode) {
        where.OR = [{ storeCode: null }, { storeCode: filters.storeCode }];
      }

      if (filters.search) {
        const match = { contains: filters.search, mode: 'insensitive' as const };
        where.AND = [{ OR: [{ name: match }, { email: match }, { subject: match }, { message: match }] }];
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
      prisma.contactMessage.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(showAll ? {} : { skip: (page - 1) * limit, take: limit }),
        select: contactMessageSelect,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return { totalRecord, data };
  }

  async findById(id: number): Promise<ContactMessageDto | null> {
    return prisma.contactMessage.findUnique({ where: { id }, select: contactMessageSelect });
  }

  async updateStatus(id: number, status: ContactMessageStatus): Promise<ContactMessageDto> {
    return prisma.contactMessage.update({ where: { id }, data: { status, updatedAt: new Date() }, select: contactMessageSelect });
  }

  async delete(id: number): Promise<ContactMessageDto> {
    return prisma.contactMessage.delete({ where: { id }, select: contactMessageSelect });
  }
}
