import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { ProductFilterParams } from '../params/product.params';
import { IProductRepository } from './interfaces/iproduct.repository';

const productInclude = {
  brandName: { select: { id: true, name: true } },   // ✅ No 'where'
  category: { select: { id: true, name: true } },   // ✅
  attribute: { select: { id: true, name: true } },  // ✅
} satisfies Prisma.productInclude;

export class ProductRepository implements IProductRepository {
  async findAll(
    filters?: ProductFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<ProductResponseDto>> {
    const where: Prisma.productWhereInput = { NOT: { status: Status.Trash } };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },

        ];
      }

      if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
      if (filters.brandNameId !== undefined) where.brandNameId = filters.brandNameId;
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
      if (filters.storeId !== undefined) where.store = { id: filters.storeId };
      if (filters.createdById !== undefined) where.createdById = filters.createdById;

      if (filters.status !== undefined) {
        where.status = filters.status;
      } else {
        where.NOT = { status: Status.Trash };
      }

      if (filters.startDate !== undefined || filters.endDate !== undefined) {
        where.createdAt = {
          ...(filters.startDate !== undefined && { gte: filters.startDate }),
          ...(filters.endDate !== undefined && { lte: filters.endDate }),
        };
      }
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { [sortBy]: sortOrder },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.product.count({ where }),
    ]);

    return { totalRecord: total, data };
  }

  async findById(id: number): Promise<ProductResponseDto | null> {
    return prisma.product.findUnique({ where: { id }, include: productInclude });
  }

  async delete(id: number): Promise<ProductResponseDto> {
    return prisma.product.update({ where: { id }, data: { status: Status.Trash } });
  }
}
