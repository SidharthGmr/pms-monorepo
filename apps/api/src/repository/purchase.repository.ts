import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { IPurchaseRepository } from './interfaces/ipurchase.repository';
import { ListResponseDto, PurchaseResponseDto } from "@pms/types";

// Sorting is client-driven, so only columns that exist on `purchase` are honoured -
// anything else falls back to the default ordering instead of failing the query.
const SORTABLE_COLUMNS = new Set(['invoiceNumber', 'supplierName', 'totalAmount', 'purchaseDate', 'createdAt', 'status']);

export class PurchaseRepository implements IPurchaseRepository {
  async getAllPurchases(
    storeCode: string,
    page: number,
    limit: number,
    search?: string,
    startDate?: Date,
    endDate?: Date,
    sortBy?: string,
    sortOrder?: string
  ): Promise<ListResponseDto<PurchaseResponseDto>> {
    const skip = (page - 1) * limit;

    const where: Prisma.purchaseWhereInput = { storeCode };
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // The list is ordered by purchaseDate, so the range filters that column too.
    if (startDate || endDate) {
      where.purchaseDate = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const direction: Prisma.SortOrder = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.purchaseOrderByWithRelationInput =
      sortBy && SORTABLE_COLUMNS.has(sortBy) ? { [sortBy]: direction } : { purchaseDate: 'desc' };

    const [data, totalRecord] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.purchase.count({ where }),
    ]);

    return { data, totalRecord };
  }

  async getPurchaseById(id: number, storeCode: string): Promise<PurchaseResponseDto | null> {
    return prisma.purchase.findFirst({
      where: { id, storeCode },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });
  }
}
