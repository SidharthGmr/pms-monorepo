import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ListResponseDto } from '../dtos/list-response.dto';
import { PriceHistoryDto, PriceHistorySummaryDto, PriceHistoryVariantScopeDto } from '../dtos/price-history.dto';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '../models/price-history.model';
import { PriceHistoryFilterParams } from '../params/price-history.params';
import { EFFECTIVE_ORDER, effectiveOn } from '../utils/variant-pricing';
import { IPriceHistoryRepository } from './interfaces/iprice-history.repository';

const priceHistoryInclude = {
  variant: {
    select: {
      id: true,
      sku: true,
      productId: true,
      storeCode: true,
      product: { select: { id: true, name: true, slug: true } },
    },
  },
};

type PriceHistoryWithVariant = Prisma.PriceHistoryGetPayload<{ include: typeof priceHistoryInclude }>;

// Sorting is client-driven, so only real columns are honoured - anything else
// falls back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['sellingPrice', 'costPrice', 'effectiveFrom', 'id']);

/**
 * Prisma maps the price columns to `Decimal`, which serializes to a JSON string.
 * The API contract exposes plain numbers, so convert at the repository boundary.
 */
function toDto(row: PriceHistoryWithVariant, previousPrice: number | null = null): PriceHistoryDto {
  return {
    id: row.id,
    variantId: row.variantId,
    storeCode: row.storeCode,
    sellingPrice: row.sellingPrice.toNumber(),
    offerPrice: row.offerPrice?.toNumber() ?? null,
    costPrice: row.costPrice?.toNumber() ?? null,
    compareAtPrice: row.compareAtPrice?.toNumber() ?? null,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    reason: row.reason,
    previousPrice,
    variant: row.variant,
  };
}

/**
 * The price each row replaced, for the given rows, resolved with a window function over
 * each variant's whole ledger. Doing it in SQL is what makes the comparison survive
 * pagination and sorting - the previous row is often not on the page at all.
 */
async function previousPricesFor(ids: number[], tx: Prisma.TransactionClient = prisma): Promise<Map<number, number>> {
  const previous = new Map<number, number>();
  if (ids.length === 0) return previous;

  const rows = await tx.$queryRaw<{ id: number; previous: Prisma.Decimal | null }[]>`
    SELECT id, previous FROM (
      SELECT id,
             LAG("sellingPrice") OVER (PARTITION BY "variantId" ORDER BY "effectiveFrom", id) AS previous
      FROM "PriceHistory"
      WHERE "deletedAt" IS NULL
        AND "variantId" IN (SELECT "variantId" FROM "PriceHistory" WHERE id IN (${Prisma.join(ids)}))
    ) ranked
    WHERE id IN (${Prisma.join(ids)}) AND previous IS NOT NULL
  `;

  for (const row of rows) {
    if (row.previous !== null) previous.set(row.id, Number(row.previous));
  }
  return previous;
}

/**
 * Ids of the rows that raised (or lowered) the price against the same variant's previous
 * one. Applied as an `id IN (...)` filter so it composes with every other filter and keeps
 * the paginated count honest.
 */
async function idsByChangeDirection(
  direction: 'increase' | 'decrease',
  storeCode: string | undefined,
  tx: Prisma.TransactionClient = prisma
): Promise<number[]> {
  const rows = await tx.$queryRaw<{ id: number }[]>`
    SELECT id FROM (
      SELECT id, "sellingPrice",
             LAG("sellingPrice") OVER (PARTITION BY "variantId" ORDER BY "effectiveFrom", id) AS previous
      FROM "PriceHistory"
      WHERE "deletedAt" IS NULL
        AND (${storeCode ?? null}::text IS NULL OR "storeCode" = ${storeCode ?? null})
    ) ranked
    WHERE previous IS NOT NULL
      AND ${direction === 'increase' ? Prisma.sql`"sellingPrice" > previous` : Prisma.sql`"sellingPrice" < previous`}
  `;
  return rows.map((row) => row.id);
}

const toNumber = (value: Prisma.Decimal | null | undefined): number | null => value?.toNumber() ?? null;

export class PriceHistoryRepository implements IPriceHistoryRepository {
  async findAll(filters?: PriceHistoryFilterParams): Promise<ListResponseDto<PriceHistoryDto>> {
    let page = 1;
    let limit = 10;
    const where: Prisma.PriceHistoryWhereInput = {};
    // Collected separately so the productId and storeCode filters cannot clobber
    // each other on the way into the relation filter.
    const variantWhere: Prisma.ProductVariantWhereInput = {};

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [
          { reason: { contains: filters.search, mode: 'insensitive' } },
          { variant: { sku: { contains: filters.search, mode: 'insensitive' } } },
          { variant: { product: { name: { contains: filters.search, mode: 'insensitive' } } } },
        ];
      }

      if (filters.variantId !== undefined) where.variantId = filters.variantId;
      if (filters.productId !== undefined) variantWhere.productId = filters.productId;

      // `storeCode` is a column on the price row now, so tenancy no longer needs the join.
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;

      if (filters.minPrice != null || filters.maxPrice != null) {
        where.sellingPrice = {
          ...(filters.minPrice != null && { gte: filters.minPrice }),
          ...(filters.maxPrice != null && { lte: filters.maxPrice }),
        };
      }

      if (filters.startDate != null || filters.endDate != null) {
        where.effectiveFrom = {
          ...(filters.startDate != null && { gte: filters.startDate }),
          ...(filters.endDate != null && { lte: filters.endDate }),
        };
      }
    }

    if (Object.keys(variantWhere).length > 0) where.variant = variantWhere;

    // Resolved before the page query so the total count reflects the filter too.
    if (filters?.changeDirection) {
      where.id = { in: await idsByChangeDirection(filters.changeDirection, filters.storeCode) };
    }

    const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'effectiveFrom';
    const direction: Prisma.SortOrder = filters?.sortOrder === 'asc' ? 'asc' : 'desc';

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const [data, total] = await Promise.all([
      prisma.priceHistory.findMany({
        where,
        include: priceHistoryInclude,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.priceHistory.count({ where }),
    ]);

    const previous = await previousPricesFor(data.map((row) => row.id));
    return { totalRecord: total, data: data.map((row) => toDto(row, previous.get(row.id) ?? null)) };
  }

  // `tx` matters when the caller is inside a transaction: a read on the global client
  // cannot see rows the open transaction has not committed yet.
  async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto | null> {
    const row = await tx.priceHistory.findUnique({ where: { id }, include: priceHistoryInclude });
    return row ? toDto(row) : null;
  }

  async findByVariant(variantId: number, page = 1, limit = 10): Promise<ListResponseDto<PriceHistoryDto>> {
    const skip = (page - 1) * limit;
    const where: Prisma.PriceHistoryWhereInput = { variantId };

    const [data, total] = await Promise.all([
      prisma.priceHistory.findMany({
        where,
        include: priceHistoryInclude,
        orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.priceHistory.count({ where }),
    ]);

    const previous = await previousPricesFor(data.map((row) => row.id));
    return { totalRecord: total, data: data.map((row) => toDto(row, previous.get(row.id) ?? null)) };
  }

  async getEffectiveOn(variantId: number, date: Date, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto | null> {
    const row = await tx.priceHistory.findFirst({
      where: { variantId, ...effectiveOn(date) },
      include: priceHistoryInclude,
      orderBy: EFFECTIVE_ORDER,
    });
    return row ? toDto(row) : null;
  }

  async getSummary(variantId: number): Promise<PriceHistorySummaryDto> {
    const where: Prisma.PriceHistoryWhereInput = { variantId };

    const [aggregate, first, current] = await Promise.all([
      prisma.priceHistory.aggregate({
        where,
        _min: { sellingPrice: true, effectiveFrom: true },
        _max: { sellingPrice: true, effectiveFrom: true },
        _avg: { sellingPrice: true },
        _count: { _all: true },
      }),
      prisma.priceHistory.findFirst({ where, orderBy: [{ effectiveFrom: 'asc' }, { id: 'asc' }] }),
      // "Current" ignores future-dated rows, which are staged rather than live.
      prisma.priceHistory.findFirst({
        where: { variantId, ...effectiveOn(new Date()) },
        orderBy: EFFECTIVE_ORDER,
      }),
    ]);

    const average = aggregate._avg.sellingPrice?.toNumber() ?? null;

    return {
      variantId,
      changeCount: aggregate._count._all,
      currentPrice: toNumber(current?.sellingPrice),
      currentCostPrice: toNumber(current?.costPrice),
      firstPrice: toNumber(first?.sellingPrice),
      minPrice: toNumber(aggregate._min.sellingPrice),
      maxPrice: toNumber(aggregate._max.sellingPrice),
      // Money to two decimals - the column itself is Decimal(12, 2).
      averagePrice: average === null ? null : Math.round(average * 100) / 100,
      firstChangedAt: aggregate._min.effectiveFrom,
      lastChangedAt: aggregate._max.effectiveFrom,
    };
  }

  /**
   * Appends a price and closes off whichever row it supersedes, so at most one row is open
   * at any moment. Closing at `effectiveFrom` rather than "now" is what makes a future-dated
   * price stage correctly - the outgoing row stays in force right up to the changeover.
   */
  async create(data: CreatePriceHistoryModel, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto> {
    const effectiveFrom = data.effectiveFrom ?? new Date();

    await tx.priceHistory.updateMany({
      where: { variantId: data.variantId, effectiveTo: null, effectiveFrom: { lte: effectiveFrom }, deletedAt: null },
      data: { effectiveTo: effectiveFrom },
    });

    const created = await tx.priceHistory.create({
      data: {
        variantId: data.variantId,
        storeCode: data.storeCode,
        sellingPrice: data.sellingPrice,
        offerPrice: data.offerPrice ?? null,
        costPrice: data.costPrice ?? null,
        compareAtPrice: data.compareAtPrice ?? null,
        effectiveFrom,
        // Usually null: the next price to arrive closes this row via the updateMany above.
        // An explicit value time-boxes it, and the variant is unpriced once it passes.
        effectiveTo: data.effectiveTo ?? null,
        reason: data.reason ?? null,
        createdById: data.createdById,
      },
      include: priceHistoryInclude,
    });
    return toDto(created);
  }

  async update(id: number, data: UpdatePriceHistoryModel, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto> {
    const updated = await tx.priceHistory.update({
      where: { id },
      data: {
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.offerPrice !== undefined && { offerPrice: data.offerPrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
        ...(data.effectiveTo !== undefined && { effectiveTo: data.effectiveTo }),
        ...(data.effectiveFrom !== undefined && { effectiveFrom: data.effectiveFrom }),
        ...(data.reason !== undefined && { reason: data.reason || null }),
        ...(data.updatedById !== undefined && { updatedById: data.updatedById }),
      },
      include: priceHistoryInclude,
    });
    return toDto(updated);
  }

  async delete(id: number, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto> {
    const deleted = await tx.priceHistory.delete({ where: { id }, include: priceHistoryInclude });
    return toDto(deleted);
  }

  async getVariantScope(variantId: number, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryVariantScopeDto | null> {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, productId: true, storeCode: true },
    });
    return variant ? { variantId: variant.id, productId: variant.productId, storeCode: variant.storeCode } : null;
  }
}
