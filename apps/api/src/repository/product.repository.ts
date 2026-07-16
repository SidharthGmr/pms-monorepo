import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ProductResponseDto, ProductWithPriceResponseDto } from '@pms/types';
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
    const [categories, brands, attributes, effectivePrices] = await Promise.all([
      categoryIds.length ? prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }) : [],
      brandNameIds.length ? prisma.brandName.findMany({ where: { id: { in: brandNameIds } }, select: { id: true, name: true } }) : [],
      attributeIds.length ? prisma.attribute.findMany({ where: { id: { in: attributeIds } }, select: { id: true, name: true } }) : [],
      productIds.length
        ? prisma.productPrice.findMany({
          where: { productId: { in: productIds }, effectiveFrom: { lte: new Date() } },
          orderBy: { effectiveFrom: 'desc' },
          select: { productId: true, sellingPrice: true, costPrice: true },
        })
        : [],
    ]);

    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const brandNames = new Map(brands.map((brand) => [brand.id, brand.name]));
    const attributeNames = new Map(attributes.map((attribute) => [attribute.id, attribute.name]));

    // Prices are latest-first, so the first row seen per product is its current price.
    // Expose only sellingPrice + costPrice.
    const currentPriceByProduct = new Map<number, { sellingPrice: number; costPrice: number | null }>();
    for (const price of effectivePrices) {
      if (!currentPriceByProduct.has(price.productId)) {
        currentPriceByProduct.set(price.productId, { sellingPrice: price.sellingPrice, costPrice: price.costPrice });
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
      };
    });

    return { totalRecord: total, data };
  }

  async findById(id: number): Promise<ProductResponseDto | null> {
    return prisma.product.findUnique({ where: { id }, include: productInclude });
  }

  async delete(id: number): Promise<ProductResponseDto> {
    return prisma.product.update({ where: { id }, data: { status: Status.Trash } });
  }
}
