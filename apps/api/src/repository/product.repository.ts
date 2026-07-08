import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductResponseDto } from '../dtos/product.dto';
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

  async findBySlug(slug: string): Promise<ProductResponseDto | null> {
    return prisma.product.findUnique({ where: { slug }, include: productInclude });
  }


  async getLowStockProducts(storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<ProductResponseDto>> {
    const skip = (page - 1) * limit;

    const idsResult = await prisma.$queryRaw<{ id: number }[]>`
      SELECT "id" FROM "product" 
      WHERE "stock" <= "lowStockThreshold" 
        AND "storeCode" = ${storeCode} 
        AND "status" != 'Trash'
      ORDER BY "stock" ASC
      LIMIT ${limit} OFFSET ${skip}
    `;
    
    const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "product" 
      WHERE "stock" <= "lowStockThreshold" 
        AND "storeCode" = ${storeCode} 
        AND "status" != 'Trash'
    `;

    const total = Number(countResult[0]?.count || 0);
    const ids = idsResult.map(r => r.id);

    const data = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: productInclude,
      orderBy: { stock: 'asc' }
    });

    return { totalRecord: total, data };
  }

  async addStock(id: number, quantity: number, userIdStr: string, storeCode: string, reason?: string): Promise<ProductResponseDto> {
    const user = await prisma.users.findUnique({ where: { userId: userIdStr } });
    if (!user) throw new Error("User not found");

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: { stock: { increment: quantity } },
        include: productInclude
      });
      await tx.stockHistory.create({
        data: {
          productId: id,
          storeCode,
          userId: user.id,
          quantity,
          reason: reason || null
        }
      });
      return product;
    });
  }

  async getStockHistory(productId: number, storeCode: string, page = 1, limit = 10): Promise<any> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.stockHistory.findMany({
        where: { productId, storeCode },
        include: { user: { select: { id: true, name: true, userId: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockHistory.count({ where: { productId, storeCode } }),
    ]);
    return { totalRecord: total, data };
  }

  async delete(id: number): Promise<ProductResponseDto> {
    return prisma.product.update({ where: { id }, data: { status: Status.Trash } });
  }
}
