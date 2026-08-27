import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { ProductFilterParams } from '../params/product.params';
import { IProductRepository } from './interfaces/iproduct.repository';



const SORTABLE_COLUMNS = new Set(['name', 'createdAt', 'updatedAt', 'displayOrder', 'id']);

const productSelect = {
  id: true,
  name: true,
  parentId: true,
  slug: true,
  description: true,
  images: true,
  storeCode: true,
  status: true,
  displayOrder: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  brandName: { select: { id: true, name: true } },
  attribute: { select: { id: true, name: true } },
} satisfies Prisma.productSelect;
export class ProductRepository implements IProductRepository {


  async findAll(
    filters?: ProductFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<ProductResponseDto>> {
    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const where: Prisma.productWhereInput = {};

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { slug: { contains: filters.search, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: filters.search, mode: 'insensitive' }, deletedAt: null } } },
        ];
      }


      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
      if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
      if (filters.brandNameId !== undefined) where.brandNameId = filters.brandNameId;
      if (filters.storeId !== undefined) where.store = { id: filters.storeId };
      if (filters.createdById !== undefined) where.createdById = filters.createdById;

      if (filters.startDate !== undefined || filters.endDate !== undefined) {
        where.createdAt = {
          ...(filters.startDate !== undefined && { gte: filters.startDate }),
          ...(filters.endDate !== undefined && { lte: filters.endDate }),
        };
      }
    }

    const showAll = filters?.showAllRecords === true;

    if (filters?.status !== undefined) {
      where.status = filters.status;
    } else if (!showAll) {
      where.NOT = { status: Status.Trash };
    }

    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const [data, total] = await Promise.all([prisma.product.findMany({
      where, orderBy: [{ [column]: direction }, { id: 'desc' }],
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      select: productSelect,
    }),
    prisma.product.count({ where }),
    ]);

    ;

    return { totalRecord: total, data };
  }


  async findById(id: number): Promise<ProductResponseDto | null> {
    const product = await prisma.product.findUnique({ where: { id }, select: productSelect });
    if (!product) return null;
    return product;
  }

  async delete(id: number, userId: string): Promise<ProductResponseDto> {
    return prisma.product.update({
      where: { id },
      data: {
        status: Status.Trash,
        deletedById: userId,
        deletedAt: new Date()
      }
    });
  }

}
