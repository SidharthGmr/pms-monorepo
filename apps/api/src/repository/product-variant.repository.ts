import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductVariantListItemDto, ProductVariantModel, ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { ProductVariantInternalDto, VariantRatingDto } from '../dtos/product-variant.dto';
import { CreateProductVariantModel, UpdateProductVariantModel } from '../models/product-variant.model';
import { ProductVariantFilterParams } from '../params/product-variant.params';
import { buildVariantSku } from '../utils/variant-sku';
import { EffectivePrice, priceForVariant, pricesForVariants, stockForVariant, stockForVariants } from '../utils/variant-pricing';
import { IProductVariantRepository } from './interfaces/iproduct-variant.repository';

const SORTABLE_COLUMNS = new Set(['sku', 'name', 'createdAt', 'id']);

/**
 * The only columns a variant response carries. Every read in this file selects exactly this,
 * so the API shape is decided in one place. `stockQuantity`, `sellingPrice` and `costPrice`
 * are NOT columns - they are derived from stockHistory / PriceHistory in `toVariantDto`.
 * `storeCode` is kept because the service uses it for the store-ownership check.
 */
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
  /** The promotion switch. Paired with the ledger's `offerPrice` to decide what is charged. */
  isOffer: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  ratingCount: true,
} satisfies Prisma.ProductVariantSelect;

type VariantRow = Prisma.ProductVariantGetPayload<{ select: typeof productVarientSelect }>;

/**
 * `findById` also feeds the store-ownership guards (cart + variant update) and the NOT NULL
 * `stockHistory.productId` foreign key, so it reads two columns the response never carries.
 * Callers strip them with `toVariantResponse` before returning to a client.
 */
const variantInternalSelect = {
  ...productVarientSelect,
  productId: true,
  storeCode: true,
} satisfies Prisma.ProductVariantSelect;

type VariantInternalRow = Prisma.ProductVariantGetPayload<{ select: typeof variantInternalSelect }>;

/** The SKU list is read across products, so each row also names the product it belongs to. */
const listItemSelect = {
  ...productVarientSelect,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      /** Fallback image for a variant with no photo of its own. */
      images: true,
      /** Storefront cards label the card with its category. */
      category: { select: { name: true, images: true } },
    },
  },
} satisfies Prisma.ProductVariantSelect;

type VariantWithProduct = Prisma.ProductVariantGetPayload<{ select: typeof listItemSelect }>;

/**
 * Attaches the derived amounts to a selected row. Generic over the row so the response shape
 * and the wider internal shape share one mapper instead of two near-identical ones.
 */
function decorate<T extends { id: number }>(row: T, price: EffectivePrice | null, stockQuantity: number) {
  return {
    ...row,
    sellingPrice: price?.sellingPrice ?? null,
    // Carried alongside the selling price rather than replacing it, so a client can show the
    // offer against the struck-through original. `payablePrice` decides which one is charged.
    offerPrice: price?.offerPrice ?? null,
    costPrice: price?.costPrice ?? null,
    // The price period comes from the same ledger row as the amounts, so an unpriced variant
    // reports null for all of them together rather than a date with no price behind it.
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
        // The variant's own `deletedAt` is checked above, but its parent's was not - so a
        // soft-deleted product's variants stayed on the public grid and were then refused by
        // every write that does guard it (wishlist.add: "Product not found in this store").
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

    // Price and stock for the whole page in two batched queries, not 2N.
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

  private async uniqueSku(tx: Prisma.TransactionClient, storeCode: string, base: string): Promise<string> {
    let candidate = base;
    let n = 1;
    while (await tx.productVariant.findFirst({ where: { storeCode, sku: candidate }, select: { id: true } })) {
      n += 1;
      candidate = `${base}-${n}`;
    }
    return candidate;
  }

  async create(data: ProductVariantModel, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto> {
    let sku = data.sku;
    if (!sku) {
      const product = await tx.product.findUnique({ where: { id: data.productId }, select: { slug: true, name: true } });
      const base = buildVariantSku(product?.slug || product?.name || `P${data.productId}`, data.attributes as unknown as Record<string, unknown> | undefined);
      sku = await this.uniqueSku(tx, data.storeCode, base);
    }

    const created = await tx.productVariant.create({
      data: {
        productId: data.productId,
        storeCode: data.storeCode,
        attributes: data.attributes ?? {},
        sku,
        metadata: { ...data } as any,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
        ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.images !== undefined && { images: data.images }),
        ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
        isActive: true,
        // Conditional like the rest: an explicit `undefined` is rejected under
        // `exactOptionalPropertyTypes`, and omitting it lets the column default to false.
        ...(data.isOffer !== undefined && { isOffer: data.isOffer }),
        createdById: data.createdById,
      },
      select: productVarientSelect,
    });

    return toVariantDto(created, null, 0);
  }

  /**
   * On-hand stock for a variant, summed from its movements. Previously this also rewrote a
   * `stockQuantity` cache column; that column is gone, so the sum is simply the answer.
   */
  async getVariantStock(variantId: number, tx: Prisma.TransactionClient = prisma): Promise<number> {
    return stockForVariant(variantId, tx);
  }

  /**
   * One variant in the response shape, for the edit screen. Store-scoped in the `where`, so a
   * row from another store simply reads as "not found" - no separate ownership check needed.
   * Carries its `product` so a screen reached from the cross-product SKU list can name it.
   */
  async findDetailById(id: number, storeCode: string, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantListItemDto | null> {
    const row = await tx.productVariant.findFirst({ where: { id, storeCode, deletedAt: null }, select: listItemSelect });
    if (!row) return null;
    const { product, ...variant } = row;
    const [price, stock] = await Promise.all([priceForVariant(id, new Date(), tx), stockForVariant(id, tx)]);
    return { ...decorate(variant, price, stock), product };
  }

  /**
   * Files this user's star rating for the variant, then rewrites the variant's `rating`
   * average and `ratingCount` from the rating rows. Both steps share the caller's
   * transaction, so the denormalised columns can never drift from the votes they summarise.
   * Rating again updates the same row - `@@unique([userId, variantId])` - rather than
   * stacking a second vote.
   */
  async rate(id: number, rating: number, userId: string, storeCode: string, tx: Prisma.TransactionClient = prisma): Promise<VariantRatingDto> {
    await tx.variantRating.upsert({
      where: { userId_variantId: { userId, variantId: id } },
      create: { userId, variantId: id, storeCode, rating },
      // storeCode is deliberately not updated - a variant never changes store.
      update: { rating },
    });

    const aggregate = await tx.variantRating.aggregate({
      where: { variantId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // One decimal place, matching how the review summary rounds its average.
    const average = aggregate._avg.rating != null ? Math.round(aggregate._avg.rating * 10) / 10 : null;
    const ratingCount = aggregate._count.rating;

    await tx.productVariant.update({ where: { id }, data: { rating: average, ratingCount } });

    return { variantId: id, userRating: rating, rating: average, ratingCount };
  }

  /**
   * One variant with its price and stock. Returns the internal shape - it carries `productId`
   * and `storeCode` for the guards, so strip it with `toVariantResponse` before responding.
   */
  async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantInternalDto | null> {
    const row = await tx.productVariant.findUnique({ where: { id }, select: variantInternalSelect });
    if (!row) return null;
    const [price, stock] = await Promise.all([priceForVariant(row.id, new Date(), tx), stockForVariant(row.id, tx)]);
    return toVariantInternalDto(row, price, stock);
  }

  async update(id: number, data: UpdateProductVariantModel, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto> {
    const updated = await tx.productVariant.update({
      where: { id },
      data: {
        // Omit unset keys so a partial update never blanks a field it did not mean to.
        // Price and stock are handled by the service (ledger + movements), not here.
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.attributes !== undefined && { attributes: data.attributes }),
        ...(data.images !== undefined && { images: data.images }),
        ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        // A plain column like the rest - the offer *amount* is the service's job (ledger).
        ...(data.isOffer !== undefined && { isOffer: data.isOffer }),
        updatedById: data.updatedById,
      },
      select: productVarientSelect,
    });
    const [price, stock] = await Promise.all([priceForVariant(updated.id, new Date(), tx), stockForVariant(updated.id, tx)]);
    return toVariantDto(updated, price, stock);
  }

  /** Active, non-deleted variants of a product, cheapest-listed first by id for stability. */
  async getActive(productId: number, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto[]> {
    const rows = await tx.productVariant.findMany({
      where: { productId, isActive: true, deletedAt: null },
      orderBy: { id: 'asc' },
      select: productVarientSelect,
    });
    return this.decorate(rows, new Date(), tx);
  }

  /**
   * Resolves what a variant cost on a given date. The variant row itself is timeless now -
   * only its price moves - so "effective on" is a PriceHistory lookup.
   */
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

  /** Attaches price and stock to a page of variant rows in two batched queries, not 2N. */
  private async decorate(rows: VariantRow[], date: Date, tx: Prisma.TransactionClient = prisma): Promise<ProductVariantResponseDto[]> {
    const ids = rows.map((row) => row.id);
    const [prices, stock] = await Promise.all([pricesForVariants(ids, date, tx), stockForVariants(ids, tx)]);
    return rows.map((row) => toVariantDto(row, prices.get(row.id) ?? null, stock.get(row.id) ?? 0));
  }
}
