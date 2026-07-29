import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductResponseDto, ProductVariantSummaryDto, ProductWithPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { ProductFilterParams } from '../params/product.params';
import { IProductRepository } from './interfaces/iproduct.repository';

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

    // Resolve related names + the current price in batched queries (no `include`).
    // "Current" price = the latest price effective as of now (by effectiveFrom).
    // Current stock = the sum of all stockHistory quantity movements per product.
    const [categories, brands, attributes, effectivePrices, stockSums, activeVariants] = await Promise.all([
      categoryIds.length ? prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }) : [],
      brandNameIds.length ? prisma.brandName.findMany({ where: { id: { in: brandNameIds } }, select: { id: true, name: true } }) : [],
      attributeIds.length ? prisma.attribute.findMany({ where: { id: { in: attributeIds } }, select: { id: true, name: true } }) : [],
      productIds.length
        ? prisma.productVariant.findMany({
          where: { productId: { in: productIds }, effectiveFrom: { lte: new Date() } },
          orderBy: { effectiveFrom: 'desc' },
          select: { productId: true, sellingPrice: true, costPrice: true },
        })
        : [],
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
          select: { id: true, productId: true, sku: true, attributes: true, stockQuantity: true, sellingPrice: true, costPrice: true },
        })
        : [],
    ]);

    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const brandNames = new Map(brands.map((brand) => [brand.id, brand.name]));
    const attributeNames = new Map(attributes.map((attribute) => [attribute.id, attribute.name]));
    const stockByProduct = new Map(stockSums.map((row) => [row.productId, row._sum.quantity ?? 0]));

    const variantsByProduct = new Map<number, ProductVariantSummaryDto[]>();
    for (const variant of activeVariants) {
      const { productId, sellingPrice, costPrice, ...rest } = variant;
      const list = variantsByProduct.get(productId) ?? [];
      // Decimal serializes to a string; the API contract is plain numbers.
      list.push({ ...rest, sellingPrice: sellingPrice.toNumber(), costPrice: costPrice?.toNumber() ?? null });
      variantsByProduct.set(productId, list);
    }

    // Prices are latest-first, so the first row seen per product is its current price.
    // Expose only sellingPrice + costPrice.
    const currentPriceByProduct = new Map<number, { sellingPrice: number; costPrice: number | null }>();
    for (const price of effectivePrices) {
      if (!currentPriceByProduct.has(price.productId)) {
        currentPriceByProduct.set(price.productId, { sellingPrice: price.sellingPrice.toNumber(), costPrice: price.costPrice?.toNumber() ?? null });
      }
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

    // Stock is not a column — it is the sum of stockHistory movements — so we cannot
    // filter it in the SQL query. Fetch the store's products, compute each product's
    // stock, then keep only those at/below their own low-stock threshold.
    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { name: 'asc' },
    });

    const productIds = products.map((product) => product.id);
    const categoryIds = [...new Set(products.map((product) => product.categoryId))];
    const brandNameIds = [...new Set(products.map((product) => product.brandNameId).filter((id): id is number => id != null))];
    const attributeIds = [...new Set(products.map((product) => product.attributeId).filter((id): id is number => id != null))];

    const [categories, brands, attributes, effectivePrices, stockSums] = await Promise.all([
      categoryIds.length ? prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }) : [],
      brandNameIds.length ? prisma.brandName.findMany({ where: { id: { in: brandNameIds } }, select: { id: true, name: true } }) : [],
      attributeIds.length ? prisma.attribute.findMany({ where: { id: { in: attributeIds } }, select: { id: true, name: true } }) : [],
      productIds.length
        ? prisma.productVariant.findMany({
          where: { productId: { in: productIds }, effectiveFrom: { lte: new Date() } },
          orderBy: { effectiveFrom: 'desc' },
          select: { productId: true, sellingPrice: true, costPrice: true },
        })
        : [],
      productIds.length
        ? prisma.stockHistory.groupBy({
          by: ['productId'],
          where: { productId: { in: productIds } },
          _sum: { quantity: true },
        })
        : [],
    ]);

    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const brandNames = new Map(brands.map((brand) => [brand.id, brand.name]));
    const attributeNames = new Map(attributes.map((attribute) => [attribute.id, attribute.name]));
    const stockByProduct = new Map(stockSums.map((row) => [row.productId, row._sum.quantity ?? 0]));

    const currentPriceByProduct = new Map<number, { sellingPrice: number; costPrice: number | null }>();
    for (const price of effectivePrices) {
      if (!currentPriceByProduct.has(price.productId)) {
        currentPriceByProduct.set(price.productId, { sellingPrice: price.sellingPrice.toNumber(), costPrice: price.costPrice?.toNumber() ?? null });
      }
    }

    const enriched = products
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
      })
      .filter((product) => product.stock <= (product.lowStockThreshold ?? 5));

    const total = enriched.length;
    const showAll = filters?.showAllRecords === true;
    const data = showAll ? enriched : enriched.slice((page - 1) * limit, (page - 1) * limit + limit);

    return { totalRecord: total, data };
  }

  async findById(id: number): Promise<ProductWithPriceResponseDto | null> {
    const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) return null;

    // Same derivation as the list endpoints: price comes from the latest effective
    // ProductVariant, stock from the sum of stockHistory movements. The edit form
    // needs both, since neither is a column on `product`.
    const [category, brand, attribute, effectivePrice, stockSum] = await Promise.all([
      prisma.category.findUnique({ where: { id: product.categoryId }, select: { name: true } }),
      product.brandNameId != null
        ? prisma.brandName.findUnique({ where: { id: product.brandNameId }, select: { name: true } })
        : null,
      product.attributeId != null
        ? prisma.attribute.findUnique({ where: { id: product.attributeId }, select: { name: true } })
        : null,
      prisma.productVariant.findFirst({
        where: { productId: id, effectiveFrom: { lte: new Date() } },
        orderBy: { effectiveFrom: 'desc' },
        select: { sellingPrice: true, costPrice: true },
      }),
      prisma.stockHistory.aggregate({ where: { productId: id }, _sum: { quantity: true } }),
    ]);

    return {
      ...product,
      category: category?.name ?? '',
      brandName: brand?.name ?? null,
      attribute: attribute?.name ?? null,
      currentPrice: effectivePrice
        ? { sellingPrice: effectivePrice.sellingPrice.toNumber(), costPrice: effectivePrice.costPrice?.toNumber() ?? null }
        : null,
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
        userId: data.userId,
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
          user: { select: { userId: true, name: true } },
          variant: { select: { id: true, sku: true, attributes: true } },
        },
      }),
      prisma.stockHistory.count({ where }),
    ]);
    return { totalRecord: total, data };
  }
}
