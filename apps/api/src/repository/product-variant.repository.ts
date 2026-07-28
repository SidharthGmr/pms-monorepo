import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateProductVariantModel } from '../models/product-variant.model';
import { buildVariantSku } from '../utils/variant-sku';
import { IProductVariantRepository } from './interfaces/iproduct-variant.repository';

/**
 * Prisma maps the price columns to `Decimal`, which serializes to a JSON string.
 * The API contract exposes plain numbers, so convert at the repository boundary.
 */
function toVariantDto<T extends { sellingPrice: Prisma.Decimal; costPrice: Prisma.Decimal | null }>(row: T) {
  return { ...row, sellingPrice: row.sellingPrice.toNumber(), costPrice: row.costPrice?.toNumber() ?? null };
}

export class ProductVariantRepository implements IProductVariantRepository {
  async create(data: CreateProductVariantModel, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto> {
    // Deactivate the previously active variant row for this product.
    await tx.productVariant.updateMany({
      where: { productId: data.productId, isActive: true },
      data: { isActive: false },
    });

    const created = await tx.productVariant.create({
      data: {
        productId: data.productId,
        storeCode: data.storeCode,
        sellingPrice: data.sellingPrice,
        // Both are NOT NULL, so `null` is not an option - default them instead.
        attributes: data.attributes ?? {},
        sku: data.sku ?? buildVariantSku(data.storeCode, data.productId),
        costPrice: data.costPrice ?? null,
        effectiveFrom: data.effectiveFrom ?? new Date(),
        isActive: true,
        reason: data.reason ?? null,
        createdById: data.createdById,
      },
    });
    return toVariantDto(created);
  }

  async getActive(productId: number, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto | null> {
    const row = await tx.productVariant.findFirst({
      where: { productId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    return row ? toVariantDto(row) : null;
  }

  async getEffectiveOn(productId: number, date: Date, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto | null> {
    const row = await tx.productVariant.findFirst({
      where: { productId, effectiveFrom: { lte: date } },
      orderBy: { effectiveFrom: 'desc' },
    });
    return row ? toVariantDto(row) : null;
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
    return { totalRecord: total, data: data.map(toVariantDto) };
  }
}
