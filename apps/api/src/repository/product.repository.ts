import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductResponseDto, ProductVariantSummaryDto, ProductWithPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { ProductFilterParams } from '../params/product.params';
import { priceForVariant, pricesForVariants, stockForVariants } from '../utils/variant-pricing';
import { IProductRepository } from './interfaces/iproduct.repository';

/** Applied when a variant sets no threshold of its own. Mirrors the schema default. */
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const productInclude = {
  // brandName: { select: { id: true, name: true } },
  // category: { select: { id: true, name: true } },
  // attribute: { select: { id: true, name: true } },
} satisfies Prisma.productInclude;

export class ProductRepository implements IProductRepository {
  async findAll(
    filters?: ProductFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<ProductWithPriceResponseDto>> {
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

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { [sortBy]: sortOrder },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.product.count({ where }),
    ]);

    // Collect the related ids referenced by the fetched products.
    const productIds = products.map((product) => product.id);
    const categoryIds = [...new Set(products.map((product) => product.categoryId))];
    const brandNameIds = [...new Set(products.map((product) => product.brandNameId).filter((id): id is number => id != null))];
    const attributeIds = [...new Set(products.map((product) => product.attributeId).filter((id): id is number => id != null))];

    // Resolve related names + the active variants in batched queries (no `include`).
    // Price and stock are not columns any more: price comes from each variant's effective
    // PriceHistory row, stock from the sum of stockHistory movements.
    const [categories, brands, attributes, stockSums, activeVariants] = await Promise.all([
      categoryIds.length ? prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }) : [],
      brandNameIds.length ? prisma.brandName.findMany({ where: { id: { in: brandNameIds } }, select: { id: true, name: true } }) : [],
      attributeIds.length ? prisma.attribute.findMany({ where: { id: { in: attributeIds } }, select: { id: true, name: true } }) : [],
      productIds.length
        ? prisma.stockHistory.groupBy({
          by: ['productId'],
          where: { productId: { in: productIds } },
          _sum: { quantity: true },
        })
        : [],
      // Active variants for the whole page in one query, so a catalog card can list
      // "S / M / L" without a request per product.
      productIds.length
        ? prisma.productVariant.findMany({
          where: { productId: { in: productIds }, isActive: true, deletedAt: null },
          orderBy: [{ productId: 'asc' }, { id: 'asc' }],
          select: { id: true, productId: true, sku: true, name: true, attributes: true, lowStockThreshold: true },
        })
        : [],
    ]);

    // One more batched pair for the page's variants, now that their ids are known.
    const variantIds = activeVariants.map((variant) => variant.id);
    const [variantPrices, variantStock] = await Promise.all([pricesForVariants(variantIds), stockForVariants(variantIds)]);

    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const brandNames = new Map(brands.map((brand) => [brand.id, brand.name]));
    const attributeNames = new Map(attributes.map((attribute) => [attribute.id, attribute.name]));
    const stockByProduct = new Map(stockSums.map((row) => [row.productId, row._sum.quantity ?? 0]));

    const variantsByProduct = new Map<number, ProductVariantSummaryDto[]>();
    for (const variant of activeVariants) {
      const { productId, ...rest } = variant;
      const price = variantPrices.get(variant.id) ?? null;
      const list = variantsByProduct.get(productId) ?? [];
      list.push({
        ...rest,
        stockQuantity: variantStock.get(variant.id) ?? 0,
        sellingPrice: price?.sellingPrice ?? null,
        costPrice: price?.costPrice ?? null,
      });
      variantsByProduct.set(productId, list);
    }

    // A product's headline price is its first active variant's - variants are ordered by id,
    // so this is stable rather than whichever row the database happened to return first.
    const currentPriceByProduct = new Map<number, { sellingPrice: number; costPrice: number | null }>();
    for (const variant of activeVariants) {
      if (currentPriceByProduct.has(variant.productId)) continue;
      const price = variantPrices.get(variant.id);
      if (price) currentPriceByProduct.set(variant.productId, { sellingPrice: price.sellingPrice, costPrice: price.costPrice });
    }

    // Attach the related names (flat) + the current price to each product.
    // Drop the raw *Id/parentId columns from the response (resolved into names).
    const data = products.map((product) => {
      const { categoryId, brandNameId, attributeId, parentId, ...rest } = product;
      return {
        ...rest,
        category: categoryNames.get(categoryId) ?? '',
        brandName: brandNameId != null ? brandNames.get(brandNameId) ?? null : null,
        attribute: attributeId != null ? attributeNames.get(attributeId) ?? null : null,
        currentPrice: currentPriceByProduct.get(product.id) ?? null,
        stock: stockByProduct.get(product.id) ?? 0,
        variants: variantsByProduct.get(product.id) ?? [],
      };
    });

    return { totalRecord: total, data };
  }

  async findLowStock(
    filters?: ProductFilterParams,
    page = 1,
    limit = 10
  ): Promise<ListResponseDto<ProductWithPriceResponseDto>> {
    const where: Prisma.productWhereInput = { NOT: { status: Status.Trash } };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
      }
      if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
      if (filters.brandNameId !== undefined) where.brandNameId = filters.brandNameId;
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
      if (filters.storeId !== undefined) where.store = { id: filters.storeId };

      if (filters.status !== undefined) {
        where.status = filters.status;
      }
    }

    // Stock is not a column — it is the sum of stockHistory movements — so it cannot be
    // filtered in SQL. Fetch the store's products, compute stock per variant, then keep the
    // products that have at least one variant at or below its own threshold.
    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { name: 'asc' },
    });

    const productIds = products.map((product) => product.id);
    const categoryIds = [...new Set(products.map((product) => product.categoryId))];
    const brandNameIds = [...new Set(products.map((product) => product.brandNameId).filter((id): id is number => id != null))];
    const attributeIds = [...new Set(products.map((product) => product.attributeId).filter((id): id is number => id != null))];

    const [categories, brands, attributes, stockSums, activeVariants] = await Promise.all([
      categoryIds.length ? prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }) : [],
      brandNameIds.length ? prisma.brandName.findMany({ where: { id: { in: brandNameIds } }, select: { id: true, name: true } }) : [],
      attributeIds.length ? prisma.attribute.findMany({ where: { id: { in: attributeIds } }, select: { id: true, name: true } }) : [],
      productIds.length
        ? prisma.stockHistory.groupBy({
          by: ['productId'],
          where: { productId: { in: productIds } },
          _sum: { quantity: true },
        })
        : [],
      productIds.length
        ? prisma.productVariant.findMany({
          where: { productId: { in: productIds }, isActive: true, deletedAt: null },
          orderBy: [{ productId: 'asc' }, { id: 'asc' }],
          select: { id: true, productId: true, lowStockThreshold: true },
        })
        : [],
    ]);

    const variantIds = activeVariants.map((variant) => variant.id);
    const [variantPrices, variantStock] = await Promise.all([pricesForVariants(variantIds), stockForVariants(variantIds)]);

    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const brandNames = new Map(brands.map((brand) => [brand.id, brand.name]));
    const attributeNames = new Map(attributes.map((attribute) => [attribute.id, attribute.name]));
    const stockByProduct = new Map(stockSums.map((row) => [row.productId, row._sum.quantity ?? 0]));

    const currentPriceByProduct = new Map<number, { sellingPrice: number; costPrice: number | null }>();
    for (const variant of activeVariants) {
      if (currentPriceByProduct.has(variant.productId)) continue;
      const price = variantPrices.get(variant.id);
      if (price) currentPriceByProduct.set(variant.productId, { sellingPrice: price.sellingPrice, costPrice: price.costPrice });
    }

    // The threshold sits on the variant now, so a product is "low" as soon as any one of its
    // variants is - a product is not restocked just because its other sizes are healthy.
    const lowProductIds = new Set<number>();
    for (const variant of activeVariants) {
      if ((variantStock.get(variant.id) ?? 0) <= (variant.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD)) {
        lowProductIds.add(variant.productId);
      }
    }

    const enriched = products
      .filter((product) => lowProductIds.has(product.id))
      .map((product) => {
        const { categoryId, brandNameId, attributeId, parentId, ...rest } = product;
        return {
          ...rest,
          category: categoryNames.get(categoryId) ?? '',
          brandName: brandNameId != null ? brandNames.get(brandNameId) ?? null : null,
          attribute: attributeId != null ? attributeNames.get(attributeId) ?? null : null,
          currentPrice: currentPriceByProduct.get(product.id) ?? null,
          stock: stockByProduct.get(product.id) ?? 0,
        };
      });

    const total = enriched.length;
    const showAll = filters?.showAllRecords === true;
    const data = showAll ? enriched : enriched.slice((page - 1) * limit, (page - 1) * limit + limit);

    return { totalRecord: total, data };
  }

  async findById(id: number): Promise<ProductWithPriceResponseDto | null> {
    const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) return null;

    // Same derivation as the list endpoints: price comes from the effective PriceHistory row
    // of the product's first active variant, stock from the sum of stockHistory movements.
    // The edit form needs both, since neither is a column on `product`.
    const [category, brand, attribute, firstVariant, stockSum] = await Promise.all([
      prisma.category.findUnique({ where: { id: product.categoryId }, select: { name: true } }),
      product.brandNameId != null
        ? prisma.brandName.findUnique({ where: { id: product.brandNameId }, select: { name: true } })
        : null,
      product.attributeId != null
        ? prisma.attribute.findUnique({ where: { id: product.attributeId }, select: { name: true } })
        : null,
      prisma.productVariant.findFirst({
        where: { productId: id, isActive: true, deletedAt: null },
        orderBy: { id: 'asc' },
        select: { id: true },
      }),
      prisma.stockHistory.aggregate({ where: { productId: id }, _sum: { quantity: true } }),
    ]);

    const effectivePrice = firstVariant ? await priceForVariant(firstVariant.id) : null;

    return {
      ...product,
      category: category?.name ?? '',
      brandName: brand?.name ?? null,
      attribute: attribute?.name ?? null,
      currentPrice: effectivePrice ? { sellingPrice: effectivePrice.sellingPrice, costPrice: effectivePrice.costPrice } : null,
      stock: stockSum._sum.quantity ?? 0,
    };
  }

  async delete(id: number): Promise<ProductResponseDto> {
    return prisma.product.update({ where: { id }, data: { status: Status.Trash } });
  }

  async getCurrentStock(productId: number, tx: Prisma.TransactionClient = prisma): Promise<number> {
    const result = await tx.stockHistory.aggregate({ where: { productId }, _sum: { quantity: true } });
    return result._sum.quantity ?? 0;
  }

  async getVariantStock(variantId: number, tx: Prisma.TransactionClient = prisma): Promise<number> {
    const result = await tx.stockHistory.aggregate({ where: { variantId }, _sum: { quantity: true } });
    return result._sum.quantity ?? 0;
  }

  async createStockHistory(
    data: { productId: number; variantId?: number | null; storeCode: string; userId: string; quantity: number; reason?: string | null },
    tx: Prisma.TransactionClient = prisma
  ): Promise<void> {
    await tx.stockHistory.create({
      data: {
        productId: data.productId,
        variantId: data.variantId ?? null,
        storeCode: data.storeCode,
        // The column was renamed `createdById` when the audit fields landed.
        createdById: data.userId,
        quantity: data.quantity,
        reason: data.reason ?? null,
      },
    });
  }

  async getStockHistory(productId: number, page = 1, limit = 10, variantId?: number): Promise<ListResponseDto<any>> {
    const skip = (page - 1) * limit;
    // Narrowing to one variant is optional so the product-level view still shows every
    // movement, including the product-keyed rows from orders and purchases.
    const where: Prisma.stockHistoryWhereInput = { productId, ...(variantId !== undefined && { variantId }) };
    const [data, total] = await Promise.all([
      prisma.stockHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: { select: { userId: true, name: true } },
          variant: { select: { id: true, sku: true, attributes: true } },
        },
      }),
      prisma.stockHistory.count({ where }),
    ]);
    return { totalRecord: total, data };
  }
}
