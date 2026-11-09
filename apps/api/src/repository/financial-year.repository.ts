import { FinancialYearDto, ListResponseDto, PageFilterParams } from '@pms/types';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { IFinancialYearRepository } from './interfaces/ifinancial-year.repository';

const SORTABLE_COLUMNS = new Set(['name', 'startDate', 'endDate', 'isClosed', 'createdAt', 'id']);

export const financialYearSelect = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  isClosed: true,
  closedAt: true,
  closedById: true,
  createdAt: true,
  updatedAt: true,
  storeCode: false,
  _count: { select: { entries: true } },
} satisfies Prisma.financialYearSelect;

type FinancialYearRow = Prisma.financialYearGetPayload<{ select: typeof financialYearSelect }>;

export const toFinancialYearDto = (row: FinancialYearRow): FinancialYearDto => ({
  id: row.id,
  name: row.name,
  startDate: row.startDate,
  endDate: row.endDate,
  isClosed: row.isClosed,
  closedAt: row.closedAt,
  closedById: row.closedById,
  entryCount: row._count.entries,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class FinancialYearRepository implements IFinancialYearRepository {
  async findAll(
    filters?: PageFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'startDate',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<FinancialYearDto>> {
    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'startDate';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const where: Prisma.financialYearWhereInput = {};

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;
      if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const [rows, total] = await Promise.all([
      prisma.financialYear.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        select: financialYearSelect,
      }),
      prisma.financialYear.count({ where }),
    ]);

    return { totalRecord: total, data: rows.map(toFinancialYearDto) };
  }

  async findById(id: number, storeCode: string): Promise<FinancialYearDto | null> {
    const row = await prisma.financialYear.findFirst({ where: { id, storeCode }, select: financialYearSelect });
    return row ? toFinancialYearDto(row) : null;
  }

  async delete(id: number, storeCode: string): Promise<FinancialYearDto> {
    const row = await prisma.financialYear.delete({ where: { id, storeCode }, select: financialYearSelect });
    return toFinancialYearDto(row);
  }

  // Any year whose range touches the candidate range. A store's years must not overlap, or a
  // posting date would resolve to two of them.
  async findOverlapping(storeCode: string, startDate: Date, endDate: Date, excludeId?: number): Promise<FinancialYearDto | null> {
    const row = await prisma.financialYear.findFirst({
      where: {
        storeCode,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        ...(excludeId !== undefined && { NOT: { id: excludeId } }),
      },
      select: financialYearSelect,
    });
    return row ? toFinancialYearDto(row) : null;
  }
}
