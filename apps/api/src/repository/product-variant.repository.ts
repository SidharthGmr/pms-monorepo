import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateProductVariantModel } from '../models/product-variant.model';
import { buildVariantSku } from '../utils/variant-sku';
import { EffectivePrice, priceForVariant, pricesForVariants, stockForVariant, stockForVariants } from '../utils/variant-pricing';
import { IProductVariantRepository } from './interfaces/iproduct-variant.repository';

type VariantRow = Prisma.ProductVariantGetPayload<{}>;

/**
 * A variant row carries no price or stock of its own any more, so the DTO is assembled from
 * the PriceHistory ledger and the stockHistory movements. A variant that has never been
 * priced reports nulls rather than a fabricated zero - zero is a real price.
 */
function toVariantDto(row: VariantRow, price: EffectivePrice | null, stockQuantity: number): ProductVariantResponseDto {
  return {
    ...row,
    sellingPrice: price?.sellingPrice ?? null,
    costPrice: price?.costPrice ?? null,
    compareAtPrice: price?.compareAtPrice ?? null,
    stockQuantity,
  };
}

export class ProductVariantRepository implements IProductVariantRepository {
  async create(data: CreateProductVariantModel, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto> {
    const created = await tx.productVariant.create({
      data: {
        productId: data.productId,
        storeCode: data.storeCode,
        // Both are NOT NULL, so `null` is not an option - default them instead.
        attributes: data.attributes ?? {},
        sku: data.sku ?? buildVariantSku(data.storeCode, data.productId),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
        // A variant is sellable as soon as it exists; the schema default of `false` would
        // otherwise hide every variant the moment it is created.
        isActive: true,
        createdById: data.createdById,
      },
    });

    // Nothing is priced or stocked yet at this point - the caller books both afterwards.
    return toVariantDto(created, null, 0);
  }

  /**
   * On-hand stock for a variant, summed from its movements. Previously this also rewrote a
   * `stockQuantity` cache column; that column is gone, so the sum is simply the answer.
   */
  async getVariantStock(variantId: number, tx: Prisma.TransactionClient = prisma): Promise<number> {
    return stockForVariant(variantId, tx);
  }

  async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto | null> {
    const row = await tx.productVariant.findUnique({ where: { id } });
    if (!row) return null;
    const [price, stock] = await Promise.all([priceForVariant(row.id, new Date(), tx), stockForVariant(row.id, tx)]);
    return toVariantDto(row, price, stock);
  }

  /** Active, non-deleted variants of a product, cheapest-listed first by id for stability. */
  async getActive(productId: number, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto[]> {
    const rows = await tx.productVariant.findMany({
      where: { productId, isActive: true, deletedAt: null },
      orderBy: { id: 'asc' },
    });
    return this.decorate(rows, new Date(), tx);
  }

  /**
   * Resolves what a variant cost on a given date. The variant row itself is timeless now -
   * only its price moves - so "effective on" is a PriceHistory lookup.
   */
  async getEffectiveOn(variantId: number, date: Date, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto | null> {
    const row = await tx.productVariant.findUnique({ where: { id: variantId } });
    if (!row) return null;
    const [price, stock] = await Promise.all([priceForVariant(variantId, date, tx), stockForVariant(variantId, tx)]);
    return toVariantDto(row, price, stock);
  }

  async getHistory(productId: number, storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<ProductVariantResponseDto>> {
    const skip = (page - 1) * limit;
    const where = { productId, storeCode };
    const [rows, total] = await Promise.all([
      prisma.productVariant.findMany({ where, orderBy: { id: 'desc' }, skip, take: limit }),
      prisma.productVariant.count({ where }),
    ]);
    return { totalRecord: total, data: await this.decorate(rows, new Date()) };
  }

  /** Attaches price and stock to a page of variant rows in two batched queries, not 2N. */
  private async decorate(rows: VariantRow[], date: Date, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto[]> {
    const ids = rows.map((row) => row.id);
    const [prices, stock] = await Promise.all([pricesForVariants(ids, date, tx), stockForVariants(ids, tx)]);
    return rows.map((row) => toVariantDto(row, prices.get(row.id) ?? null, stock.get(row.id) ?? 0));
  }
}
