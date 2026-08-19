import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductVariantListItemDto, ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateProductVariantModel } from '../models/product-variant.model';
import { ProductVariantFilterParams } from '../params/product-variant.params';
import { buildVariantSku } from '../utils/variant-sku';
import { EffectivePrice, priceForVariant, pricesForVariants, stockForVariant, stockForVariants } from '../utils/variant-pricing';
import { IProductVariantRepository } from './interfaces/iproduct-variant.repository';

type VariantRow = Prisma.ProductVariantGetPayload<{}>;

/**
 * Sorting is client-driven, so only real columns are honoured. Price and stock are derived
 * (from the ledger and the movements), so they cannot be sorted in SQL - anything unknown
 * falls back to the default rather than failing the query.
 */
const SORTABLE_COLUMNS = new Set(['sku', 'name', 'createdAt', 'id']);

const listItemInclude = {
  product: { select: { id: true, name: true, slug: true, categoryId: true } },
} satisfies Prisma.ProductVariantInclude;

type VariantWithProduct = Prisma.ProductVariantGetPayload<{ include: typeof listItemInclude }>;

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
  /**
   * Every variant in the store, read across products rather than within one. Price and stock
   * are not columns, so they are attached afterwards in two batched queries for the whole
   * page - never one pair per row.
   */
  async findAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>> {
    const page = filters?.page ?? 1;
    const limit = filters?.recordPerPage ?? 10;

    // Soft-deleted variants never appear: they are not sellable and their SKU is retired.
    const where: Prisma.ProductVariantWhereInput = { deletedAt: null };

    if (filters) {
      // The tenant always comes from the token, never the query string.
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
      if (filters.productId !== undefined) where.productId = filters.productId;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.categoryId !== undefined) where.product = { categoryId: filters.categoryId };

      if (filters.search) {
        where.OR = [
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
          { barcode: { contains: filters.search, mode: 'insensitive' } },
          { product: { name: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }

      if (filters.startDate !== undefined || filters.endDate !== undefined) {
        where.createdAt = {
          ...(filters.startDate !== undefined && { gte: filters.startDate }),
          ...(filters.endDate !== undefined && { lte: filters.endDate }),
        };
      }
    }

    const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
    const direction: Prisma.SortOrder = filters?.sortOrder === 'asc' ? 'asc' : 'desc';

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const [rows, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        include: listItemInclude,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.productVariant.count({ where }),
    ]);

    const ids = rows.map((row) => row.id);
    const [prices, stock] = await Promise.all([pricesForVariants(ids), stockForVariants(ids)]);

    const data = rows.map((row: VariantWithProduct) => {
      const { product, ...variant } = row;
      return {
        ...toVariantDto(variant, prices.get(row.id) ?? null, stock.get(row.id) ?? 0),
        product,
      };
    });

    return { totalRecord: total, data };
  }

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
