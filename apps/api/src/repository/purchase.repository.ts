import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { IPurchaseRepository } from './interfaces/ipurchase.repository';
import { ListResponseDto, PurchaseResponseDto } from "@pms/types";

export class PurchaseRepository implements IPurchaseRepository {
  async getAllPurchases(storeCode: string, page: number, limit: number, search?: string): Promise<ListResponseDto<PurchaseResponseDto>> {
    const skip = (page - 1) * limit;

    const where: Prisma.purchaseWhereInput = { storeCode };
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, totalRecord] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
        skip,
        take: limit,
        orderBy: { purchaseDate: 'desc' },
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
