import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateProductPriceModel } from '../models/product-price.model';
import { IProductPriceRepository } from './interfaces/iproduct-price.repository';

export class ProductPriceRepository implements IProductPriceRepository {
  async create(data: CreateProductPriceModel, tx: Prisma.TransactionClient = prisma): Promise<ProductPriceResponseDto> {
    // Deactivate the previously active price row for this product.
    await tx.productPrice.updateMany({
      where: { productId: data.productId, isActive: true },
      data: { isActive: false },
    });

    return tx.productPrice.create({
      data: {
        productId: data.productId,
        storeCode: data.storeCode,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice ?? null,
        effectiveFrom: data.effectiveFrom ?? new Date(),
        isActive: true,
        reason: data.reason ?? null,
        createdById: data.createdById,
      },
    });
  }

  async getActive(productId: number, tx: Prisma.TransactionClient = prisma): Promise<ProductPriceResponseDto | null> {
    return tx.productPrice.findFirst({
      where: { productId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getEffectiveOn(productId: number, date: Date, tx: Prisma.TransactionClient = prisma): Promise<ProductPriceResponseDto | null> {
    return tx.productPrice.findFirst({
      where: { productId, effectiveFrom: { lte: date } },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getHistory(productId: number, storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<ProductPriceResponseDto>> {
    const skip = (page - 1) * limit;
    const where = { productId, storeCode };
    const [data, total] = await Promise.all([
      prisma.productPrice.findMany({
        where,
        orderBy: { effectiveFrom: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productPrice.count({ where }),
    ]);
    return { totalRecord: total, data };
  }
}
