import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ListResponseDto, TaxDto, TaxFilterParams } from '@pms/types';
import { ITaxRepository } from './interfaces/itax.repository';

const taxSelect = {
  id: true,
  name: true,
  code: true,
  rate: true,
  category: true,
  isActive: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: false,
} satisfies Prisma.TaxSelect;

type TaxRow = Prisma.TaxGetPayload<{ select: typeof taxSelect }>;

// An arbitrary sortBy reaching Prisma's orderBy is a runtime error, so it is allow-listed.
const SORTABLE_COLUMNS = new Set(['name', 'code', 'rate', 'category', 'isActive', 'createdAt', 'updatedAt']);

// Prisma maps `rate` to Decimal, which serializes to a JSON string; the API contract is a number.
function toDto(row: TaxRow): TaxDto {
  return { ...row, rate: row.rate.toNumber() };
}

export class TaxRepository implements ITaxRepository {
  async findAll(
    filters?: TaxFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<TaxDto>> {
    const where: Prisma.TaxWhereInput = { deletedAt: null };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }, { code: { contains: filters.search, mode: 'insensitive' } }];
      }
      if (filters.category !== undefined) {
        where.category = filters.category;
      }
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.TaxOrderByWithRelationInput[] = [{ [column]: direction }, { id: 'desc' }];

    const [data, total] = await Promise.all([
      prisma.tax.findMany({
        where,
        select: taxSelect,
        orderBy,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.tax.count({ where }),
    ]);

    return { totalRecord: total, data: data.map(toDto) };
  }

  async findById(id: string): Promise<TaxDto | null> {
    const row = await prisma.tax.findFirst({ where: { id, deletedAt: null }, select: taxSelect });
    return row ? toDto(row) : null;
  }

  async delete(id: string): Promise<TaxDto> {
    // A deleted tax cannot stay the default, or the "only one default" rule would count it.
    const row = await prisma.tax.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
      select: taxSelect,
    });
    return toDto(row);
  }
}
