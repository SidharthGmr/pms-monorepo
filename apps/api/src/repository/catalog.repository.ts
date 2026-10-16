import {
  CatalogFacetsDto,
  CatalogFilterParams,
  CatalogProductDto,
  CatalogVariantAttributeDto,
  CatalogVariantDto,
  ListResponseDto,
} from "@pms/types";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { payableForVariant, pricesForVariants, stockForVariants } from "../utils/variant-pricing";
import { ICatalogRepository } from "./interfaces/icatalog.repository";

/**
 * Read-only storefront catalog. Price and stock live in ledgers (PriceHistory, stockHistory)
 * rather than on the variant row, so the variant-level filters - price range, in stock - and
 * the price sort cannot be expressed as one Prisma query. The shape here is: narrow the
 * candidate set in SQL (published, store, search, category, brand), decorate every surviving
 * variant from the ledgers in two batched queries, then filter/sort/page the decorated set in
 * process. Store catalogs are hundreds of variants, not millions, so the in-process half is
 * cheap; revisit if a store ever outgrows that.
 */

const catalogProductSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  images: true,
  isFeatured: true,
  categoryId: true,
  brandNameId: true,
  createdAt: true,
  category: { select: { name: true } },
  brandName: { select: { name: true } },
  variants: {
    where: { deletedAt: null, isActive: true, status: "Published" as const },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      images: true,
      isOffer: true,
      attributes: true,
    },
  },
} satisfies Prisma.productSelect;

type CatalogRow = Prisma.productGetPayload<{ select: typeof catalogProductSelect }>;
type RawAttribute = { attributeid?: number; attributeValueId?: number };
type EntryRow = { id: number; value: string; colorHex: string | null; attributeId: number; attributeName: string };

const SORTS = new Set(["price", "name", "newest", "rating"]);

export class CatalogRepository implements ICatalogRepository {
  async findAll(filters?: CatalogFilterParams): Promise<ListResponseDto<CatalogProductDto>> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.recordPerPage && filters.recordPerPage > 0 ? filters.recordPerPage : 12;

    const where: Prisma.productWhereInput = {
      status: "Published",
      deletedAt: null,
      variants: { some: { deletedAt: null, isActive: true, status: "Published" } },
    };
    if (filters?.storeCode) where.storeCode = filters.storeCode;
    if (filters?.categoryIds?.length) where.categoryId = { in: filters.categoryIds };
    if (filters?.brandNameIds?.length) where.brandNameId = { in: filters.brandNameIds };
    if (filters?.featuredOnly) where.isFeatured = true;
    if (filters?.search) {
      const match = { contains: filters.search, mode: "insensitive" as const };
      where.OR = [{ name: match }, { slug: match }, { variants: { some: { OR: [{ name: match }, { sku: match }] } } }];
    }

    const rows = await prisma.product.findMany({ where, select: catalogProductSelect, orderBy: { id: "asc" } });

    const variantIds = rows.flatMap((row) => row.variants.map((variant) => variant.id));
    const [prices, stock, entryById, reviews] = await Promise.all([
      pricesForVariants(variantIds),
      stockForVariants(variantIds),
      this.entriesForVariants(rows),
      this.reviewStats(rows.map((row) => row.id)),
    ]);

    const entryGroups = await this.groupEntryFilters(filters?.entryIds);

    const products: CatalogProductDto[] = [];
    for (const row of rows) {
      const decorated = row.variants.map((variant) => this.toVariantDto(variant, prices, stock, entryById));
      const matched = decorated.filter((variant) => this.variantMatches(variant, filters, entryGroups));
      if (matched.length === 0) continue;

      const stats = reviews.get(row.id);
      if (filters?.minRating != null && (stats?.rating ?? 0) < filters.minRating) continue;

      const payables = matched.map((variant) => variant.payablePrice).filter((value): value is number => value != null);
      products.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        shortDescription: row.shortDescription,
        images: row.images,
        isFeatured: row.isFeatured,
        categoryId: row.categoryId,
        categoryName: row.category.name,
        brandNameId: row.brandNameId,
        brandName: row.brandName?.name ?? null,
        minPrice: payables.length ? Math.min(...payables) : null,
        maxPrice: payables.length ? Math.max(...payables) : null,
        rating: stats?.rating ?? null,
        ratingCount: stats?.count ?? 0,
        variants: matched,
        totalVariants: row.variants.length,
        createdAt: row.createdAt,
      });
    }

    this.sortProducts(products, filters);

    const totalRecord = products.length;
    const data = filters?.showAllRecords === true ? products : products.slice((page - 1) * limit, page * limit);
    return { totalRecord, data };
  }

  async findBySlug(slug: string, storeCode?: string): Promise<CatalogProductDto | null> {
    const detailSelect = { ...catalogProductSelect, description: true, store: { select: { name: true, address: true, phone: true, email: true } } };
    const base = {
      status: "Published" as const,
      deletedAt: null,
      variants: { some: { deletedAt: null, isActive: true, status: "Published" as const } },
      ...(storeCode ? { storeCode } : {}),
    };

    // The path segment is normally the product slug, but every pre-existing link on the site
    // points at a variant SKU - both keep working by falling back to a SKU lookup.
    const row =
      (await prisma.product.findFirst({ where: { ...base, slug }, select: detailSelect })) ??
      (await prisma.product.findFirst({ where: { ...base, variants: { some: { sku: slug, deletedAt: null } } }, select: detailSelect }));
    if (!row) return null;

    const variantIds = row.variants.map((variant) => variant.id);
    const [prices, stock, entryById, reviews] = await Promise.all([
      pricesForVariants(variantIds),
      stockForVariants(variantIds),
      this.entriesForVariants([row]),
      this.reviewStats([row.id]),
    ]);

    const variants = row.variants.map((variant) => this.toVariantDto(variant, prices, stock, entryById));
    const payables = variants.map((variant) => variant.payablePrice).filter((value): value is number => value != null);
    const stats = reviews.get(row.id);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.shortDescription,
      description: row.description,
      store: row.store,
      images: row.images,
      isFeatured: row.isFeatured,
      categoryId: row.categoryId,
      categoryName: row.category.name,
      brandNameId: row.brandNameId,
      brandName: row.brandName?.name ?? null,
      minPrice: payables.length ? Math.min(...payables) : null,
      maxPrice: payables.length ? Math.max(...payables) : null,
      rating: stats?.rating ?? null,
      ratingCount: stats?.count ?? 0,
      variants,
      totalVariants: variants.length,
      createdAt: row.createdAt,
    };
  }

  async getFacets(storeCode?: string): Promise<CatalogFacetsDto> {
    const productWhere: Prisma.productWhereInput = {
      status: "Published",
      deletedAt: null,
      variants: { some: { deletedAt: null, isActive: true, status: "Published" } },
      ...(storeCode ? { storeCode } : {}),
    };

    const rows = await prisma.product.findMany({
      where: productWhere,
      select: {
        categoryId: true,
        brandNameId: true,
        category: { select: { name: true } },
        brandName: { select: { name: true } },
        variants: {
          where: { deletedAt: null, isActive: true, status: "Published" },
          select: { id: true, isOffer: true, attributes: true },
        },
      },
    });

    const categories = new Map<number, { name: string; count: number }>();
    const brands = new Map<number, { name: string; count: number }>();
    const entryCounts = new Map<number, number>();
    for (const row of rows) {
      const category = categories.get(row.categoryId) ?? { name: row.category.name, count: 0 };
      category.count += 1;
      categories.set(row.categoryId, category);

      if (row.brandNameId != null && row.brandName) {
        const brand = brands.get(row.brandNameId) ?? { name: row.brandName.name, count: 0 };
        brand.count += 1;
        brands.set(row.brandNameId, brand);
      }

      for (const variant of row.variants) {
        for (const raw of this.rawAttributes(variant.attributes)) {
          if (raw.attributeValueId != null) entryCounts.set(raw.attributeValueId, (entryCounts.get(raw.attributeValueId) ?? 0) + 1);
        }
      }
    }

    const entries = await prisma.masterEntry.findMany({
      where: { id: { in: [...entryCounts.keys()] } },
      select: { id: true, value: true, colorHex: true, attributeId: true, attribute: { select: { name: true } } },
      orderBy: [{ attributeId: "asc" }, { displayOrder: "asc" }, { id: "asc" }],
    });
    const attributes = new Map<number, { name: string; entries: { id: number; value: string; colorHex: string | null; count: number }[] }>();
    for (const entry of entries) {
      const group = attributes.get(entry.attributeId) ?? { name: entry.attribute.name, entries: [] };
      group.entries.push({ id: entry.id, value: entry.value, colorHex: entry.colorHex, count: entryCounts.get(entry.id) ?? 0 });
      attributes.set(entry.attributeId, group);
    }

    const variantIds = rows.flatMap((row) => row.variants.map((variant) => variant.id));
    const prices = await pricesForVariants(variantIds);
    const payables: number[] = [];
    for (const row of rows) {
      for (const variant of row.variants) {
        const price = prices.get(variant.id);
        const payable = payableForVariant({
          sellingPrice: price?.sellingPrice ?? null,
          offerPrice: price?.offerPrice ?? null,
          isOffer: variant.isOffer,
        });
        if (payable != null) payables.push(payable);
      }
    }

    return {
      categories: [...categories.entries()].map(([id, value]) => ({ id, name: value.name, count: value.count })).sort((a, b) => a.name.localeCompare(b.name)),
      brands: [...brands.entries()].map(([id, value]) => ({ id, name: value.name, count: value.count })).sort((a, b) => a.name.localeCompare(b.name)),
      attributes: [...attributes.entries()].map(([id, value]) => ({ id, name: value.name, entries: value.entries })),
      price: payables.length ? { min: Math.min(...payables), max: Math.max(...payables) } : null,
    };
  }

  // Ratings belong to the product: the average and count of its Published reviews, batched
  // for a whole page in one groupBy.
  private async reviewStats(productIds: number[]): Promise<Map<number, { rating: number | null; count: number }>> {
    const stats = new Map<number, { rating: number | null; count: number }>();
    if (productIds.length === 0) return stats;

    const rows = await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, status: "Published" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const row of rows) stats.set(row.productId, { rating: row._avg.rating, count: row._count._all });
    return stats;
  }

  private rawAttributes(value: Prisma.JsonValue): RawAttribute[] {
    return Array.isArray(value) ? (value as RawAttribute[]) : [];
  }

  // Variant rows store attribute picks as bare id pairs; one query resolves every id used on
  // this page into its display name/value/swatch so the client never has to join them itself.
  private async entriesForVariants(rows: CatalogRow[]): Promise<Map<number, EntryRow>> {
    const ids = new Set<number>();
    for (const row of rows) {
      for (const variant of row.variants) {
        for (const raw of this.rawAttributes(variant.attributes)) {
          if (raw.attributeValueId != null) ids.add(raw.attributeValueId);
        }
      }
    }
    const byId = new Map<number, EntryRow>();
    if (ids.size === 0) return byId;

    const entries = await prisma.masterEntry.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, value: true, colorHex: true, attributeId: true, attribute: { select: { name: true } } },
    });
    for (const entry of entries) {
      byId.set(entry.id, { id: entry.id, value: entry.value, colorHex: entry.colorHex, attributeId: entry.attributeId, attributeName: entry.attribute.name });
    }
    return byId;
  }

  // Ticked values arrive as one flat list; grouping them by their attribute makes the sidebar
  // behave the standard way - OR inside an attribute, AND across attributes.
  private async groupEntryFilters(entryIds?: number[]): Promise<number[][]> {
    if (!entryIds?.length) return [];
    const entries = await prisma.masterEntry.findMany({ where: { id: { in: entryIds } }, select: { id: true, attributeId: true } });
    const groups = new Map<number, number[]>();
    for (const entry of entries) {
      const group = groups.get(entry.attributeId) ?? [];
      group.push(entry.id);
      groups.set(entry.attributeId, group);
    }
    return [...groups.values()];
  }

  private toVariantDto(
    variant: CatalogRow["variants"][number],
    prices: Awaited<ReturnType<typeof pricesForVariants>>,
    stock: Awaited<ReturnType<typeof stockForVariants>>,
    entryById: Map<number, EntryRow>
  ): CatalogVariantDto {
    const price = prices.get(variant.id);
    const onHand = stock.get(variant.id) ?? 0;
    const attributes: CatalogVariantAttributeDto[] = [];
    for (const raw of this.rawAttributes(variant.attributes)) {
      const entry = raw.attributeValueId != null ? entryById.get(raw.attributeValueId) : undefined;
      if (entry) attributes.push({ attributeId: entry.attributeId, attributeName: entry.attributeName, entryId: entry.id, value: entry.value, colorHex: entry.colorHex });
    }
    return {
      id: variant.id,
      name: variant.name,
      slug: variant.slug,
      sku: variant.sku,
      images: variant.images,
      isOffer: variant.isOffer,
      stock: onHand,
      inStock: onHand > 0,
      sellingPrice: price?.sellingPrice ?? null,
      offerPrice: price?.offerPrice ?? null,
      compareAtPrice: price?.compareAtPrice ?? null,
      payablePrice: payableForVariant({ sellingPrice: price?.sellingPrice ?? null, offerPrice: price?.offerPrice ?? null, isOffer: variant.isOffer }),
      attributes,
    };
  }

  private variantMatches(variant: CatalogVariantDto, filters: CatalogFilterParams | undefined, entryGroups: number[][]): boolean {
    if (!filters) return true;
    if (filters.inStockOnly && !variant.inStock) return false;
    if (filters.offersOnly && !(variant.isOffer && variant.offerPrice != null)) return false;
    if (filters.minPrice != null && (variant.payablePrice == null || variant.payablePrice < filters.minPrice)) return false;
    if (filters.maxPrice != null && (variant.payablePrice == null || variant.payablePrice > filters.maxPrice)) return false;
    for (const group of entryGroups) {
      if (!variant.attributes.some((attribute) => group.includes(attribute.entryId))) return false;
    }
    return true;
  }

  private sortProducts(products: CatalogProductDto[], filters?: CatalogFilterParams): void {
    const direction = filters?.sortDirection === "asc" ? 1 : -1;
    const sortBy = filters?.sortBy && SORTS.has(filters.sortBy) ? filters.sortBy : "newest";
    products.sort((a, b) => {
      switch (sortBy) {
        case "price": {
          const left = a.minPrice ?? Number.MAX_SAFE_INTEGER;
          const right = b.minPrice ?? Number.MAX_SAFE_INTEGER;
          return (left - right) * (filters?.sortDirection === "desc" ? -1 : 1);
        }
        case "name":
          return a.name.localeCompare(b.name) * (filters?.sortDirection === "desc" ? -1 : 1);
        case "rating":
          return ((a.rating ?? 0) - (b.rating ?? 0)) * direction;
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      }
    });
  }
}
