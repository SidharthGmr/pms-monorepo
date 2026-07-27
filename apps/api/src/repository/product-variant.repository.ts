import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateProductVariantModel } from '../models/product-variant.model';
import { IProductVariantRepository } from './interfaces/iproduct-variant.repository';

export class ProductVariantRepository implements IProductVariantRepository {
  async create(data: CreateProductVariantModel, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto> {
    // Deactivate the previously active variant row for this product.
    await tx.productVariant.updateMany({
      where: { productId: data.productId, isActive: true },
      data: { isActive: false },
    });

    return tx.productVariant.create({
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

  async getActive(productId: number, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto | null> {
    return tx.productVariant.findFirst({
      where: { productId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getEffectiveOn(productId: number, date: Date, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto | null> {
    return tx.productVariant.findFirst({
      where: { productId, effectiveFrom: { lte: date } },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getHistory(productId: number, storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<ProductVariantResponseDto>> {
    const skip = (page - 1) * limit;
    const where = { productId, storeCode };
    const [data, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        orderBy: { effectiveFrom: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productVariant.count({ where }),
    ]);
    return { totalRecord: total, data };
  }
}
