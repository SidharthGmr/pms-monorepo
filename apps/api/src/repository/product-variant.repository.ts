import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductVariantListItemDto, ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { ProductVariantInternalDto, VariantRatingDto } from '../dtos/product-variant.dto';
import { ProductVariantFilterParams } from '../params/product-variant.params';
import { EffectivePrice, priceForVariant, pricesForVariants, stockForVariant, stockForVariants } from '../utils/variant-pricing';
import { IProductVariantRepository } from './interfaces/iproduct-variant.repository';

const SORTABLE_COLUMNS = new Set(['sku', 'name', 'createdAt', 'id']);

const productVarientSelect = {
  id: true,
  sku: true,
  name: true,
  barcode: true,
  attributes: true,
  images: true,
  lowStockThreshold: true,
  description: true,
  isActive: true,
  isOffer: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  ratingCount: true,
} satisfies Prisma.ProductVariantSelect;

type VariantRow = Prisma.ProductVariantGetPayload<{ select: typeof productVarientSelect }>;

const variantInternalSelect = {
  ...productVarientSelect,
  productId: true,
  storeCode: true,
} satisfies Prisma.ProductVariantSelect;

type VariantInternalRow = Prisma.ProductVariantGetPayload<{ select: typeof variantInternalSelect }>;

const listItemSelect = {
  ...productVarientSelect,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      images: true,
      category: { select: { name: true, images: true } },
    },
  },
} satisfies Prisma.ProductVariantSelect;

type VariantWithProduct = Prisma.ProductVariantGetPayload<{ select: typeof listItemSelect }>;

function decorate<T extends { id: number }>(row: T, price: EffectivePrice | null, stockQuantity: number) {
  return {
    ...row,
    sellingPrice: price?.sellingPrice ?? null,
    offerPrice: price?.offerPrice ?? null,
    costPrice: price?.costPrice ?? null,
    effectiveFrom: price?.effectiveFrom ?? null,
    effectiveTo: price?.effectiveTo ?? null,
    stockQuantity,
  };
}

function toVariantDto(row: VariantRow, price: EffectivePrice | null, stockQuantity: number): ProductVariantResponseDto {
  return decorate(row, price, stockQuantity);
}

function toVariantInternalDto(row: VariantInternalRow, price: EffectivePrice | null, stockQuantity: number): ProductVariantInternalDto {
  return decorate(row, price, stockQuantity);
}

export class ProductVariantRepository implements IProductVariantRepository {

  async findAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>> {
    const page = filters?.page ?? 1;
    const limit = filters?.recordPerPage ?? 10;

    const where: Prisma.ProductVariantWhereInput = { deletedAt: null };

    if (filters) {
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
      if (filters.productId !== undefined) where.productId = filters.productId;
      if (filters.productIds?.length) where.productId = { in: filters.productIds };
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      const productWhere: Prisma.productWhereInput = {};
      if (filters.categoryId !== undefined) productWhere.categoryId = filters.categoryId;
      if (filters.publishedOnly) {
        productWhere.status = Status.Published;
        productWhere.deletedAt = null;
      }
      if (Object.keys(productWhere).length > 0) where.product = productWhere;

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
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        select: listItemSelect,
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

  async getVariantStock(variantId: number, tx: Prisma.TransactionClient = prisma): Promise<number> {
    return stockForVariant(variantId, tx);
  }

  async findDetailById(id: number, storeCode: string, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantListItemDto | null> {
    const row = await tx.productVariant.findFirst({ where: { id, storeCode, deletedAt: null }, select: listItemSelect });
    if (!row) return null;
    const { product, ...variant } = row;
    const [price, stock] = await Promise.all([priceForVariant(id, new Date(), tx), stockForVariant(id, tx)]);
    return { ...decorate(variant, price, stock), product };
  }

  async rate(id: number, rating: number, userId: string, storeCode: string, tx: Prisma.TransactionClient = prisma): Promise<VariantRatingDto> {
    await tx.variantRating.upsert({
      where: { userId_variantId: { userId, variantId: id } },
      create: { userId, variantId: id, storeCode, rating },
      update: { rating },
    });

    const aggregate = await tx.variantRating.aggregate({
      where: { variantId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const average = aggregate._avg.rating != null ? Math.round(aggregate._avg.rating * 10) / 10 : null;
    const ratingCount = aggregate._count.rating;

    await tx.productVariant.update({ where: { id }, data: { rating: average, ratingCount } });

    return { variantId: id, userRating: rating, rating: average, ratingCount };
  }

  async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantInternalDto | null> {
    const row = await tx.productVariant.findUnique({ where: { id }, select: variantInternalSelect });
    if (!row) return null;
    const [price, stock] = await Promise.all([priceForVariant(row.id, new Date(), tx), stockForVariant(row.id, tx)]);
    return toVariantInternalDto(row, price, stock);
  }

  async getActive(productId: number, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto[]> {
    const rows = await tx.productVariant.findMany({
      where: { productId, isActive: true, deletedAt: null },
      orderBy: { id: 'asc' },
      select: productVarientSelect,
    });
    return this.decorate(rows, new Date(), tx);
  }

  async getEffectiveOn(variantId: number, date: Date, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto | null> {
    const row = await tx.productVariant.findUnique({ where: { id: variantId }, select: productVarientSelect });
    if (!row) return null;
    const [price, stock] = await Promise.all([priceForVariant(variantId, date, tx), stockForVariant(variantId, tx)]);
    return toVariantDto(row, price, stock);
  }

  async getHistory(productId: number, storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<ProductVariantResponseDto>> {
    const skip = (page - 1) * limit;
    const where = { productId, storeCode };
    const [rows, total] = await Promise.all([
      prisma.productVariant.findMany({ where, orderBy: { id: 'desc' }, skip, take: limit, select: productVarientSelect }),
      prisma.productVariant.count({ where }),
    ]);
    return { totalRecord: total, data: await this.decorate(rows, new Date()) };
  }

  private async decorate(rows: VariantRow[], date: Date, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto[]> {
    const ids = rows.map((row) => row.id);
    const [prices, stock] = await Promise.all([pricesForVariants(ids, date, tx), stockForVariants(ids, tx)]);
    return rows.map((row) => toVariantDto(row, prices.get(row.id) ?? null, stock.get(row.id) ?? 0));
  }
}
