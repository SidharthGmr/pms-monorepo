import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ICategoryRepository } from './interfaces/icategory.repository';
import { CategoryFilterParams, CategoryResponseDto, ListResponseDto, StatusEnum } from '@pms/types';

// Sorting is client-driven, so only real columns are honoured - anything else falls
// back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['name', 'status', 'displayOrder', 'createdAt', 'updatedAt']);

export class CategoryRepository implements ICategoryRepository {
  async findAll(
    filters?: CategoryFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<CategoryResponseDto>> {
    // Soft delete is the only delete now, so `deletedAt` - not `status: Trash` - decides
    // whether a row is visible. `includeDeleted` lets an admin see the trashed ones.
    const where: Prisma.categoryWhereInput = {};

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.includeDeleted !== true) {
        where.deletedAt = null;
      }

      if (filters.search) {
        where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
      }

      if (filters.status !== undefined) {
        where.status = filters.status as StatusEnum;
      }

      if (filters.storeCode !== undefined) {
        where.storeCode = filters.storeCode;
      }

      if (filters.parentId !== undefined) {
        where.parentId = filters.parentId;
      }

      if (filters.startDate != null || filters.endDate != null) {
        where.createdAt = {
          ...(filters.startDate != null && { gte: filters.startDate }),
          ...(filters.endDate != null && { lte: filters.endDate }),
        };
      }
    } else {
      where.deletedAt = null;
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    // `displayOrder` is NOT NULL with a 0 default now, so the old nulls-last workaround is
    // gone. Newest-first stays the default so a freshly added category lands on page one.
    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.categoryOrderByWithRelationInput[] = [{ [column]: direction }, { id: 'desc' }];

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.category.count({ where }),
    ]);

    return { totalRecord: total, data };
  }

  // `findFirst`, not `findUnique`: the `deletedAt` predicate is not part of the
  // `@@unique([storeCode, id])` key, so it cannot go in a unique where-clause.
  async findById(id: number, storeCode: string, includeDeleted = false): Promise<CategoryResponseDto | null> {
    return prisma.category.findFirst({
      where: { id, storeCode, ...(includeDeleted ? {} : { deletedAt: null }) },
    });
  }

  async countChildren(id: number, storeCode: string): Promise<number> {
    return prisma.category.count({ where: { parentId: id, storeCode, deletedAt: null } });
  }

  async countProducts(id: number, storeCode: string): Promise<number> {
    return prisma.product.count({ where: { categoryId: id, storeCode, deletedAt: null } });
  }

  async delete(id: number, storeCode: string, userId: string): Promise<CategoryResponseDto> {
    return prisma.category.update({
      where: { storeCode_id: { storeCode, id } },
      data: { deletedAt: new Date(), deletedById: userId },
    });
  }
}
