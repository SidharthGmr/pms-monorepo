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
    productId: row.productId,
    storeCode: row.storeCode,
    isCurrent: row.isCurrent,
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

/**
 * `isCurrent` is a cache of the same rule the cart and orders price through: the latest row that
 * has started and has not been superseded. The dates stay the source of truth, so this recomputes
 * the flag from them for the given variants and writes only what actually drifted - a staged price
 * becomes current the moment its date passes, and nothing is running to notice that on its own.
 */
async function syncCurrentFlags(variantIds: number[], tx: Prisma.TransactionClient = prisma): Promise<Set<number>> {
  const ids = [...new Set(variantIds)].filter((id) => Number.isFinite(id));
  if (ids.length === 0) return new Set();

  const now = new Date();
  const rows = await tx.priceHistory.findMany({
    where: { variantId: { in: ids } },
    orderBy: EFFECTIVE_ORDER,
    select: { id: true, variantId: true, isCurrent: true, effectiveFrom: true, effectiveTo: true, deletedAt: true },
  });

  // Rows arrive newest-first, so the first one per variant that is in force is the current one.
  const settled = new Set<number>();
  const current = new Set<number>();
  for (const row of rows) {
    if (settled.has(row.variantId)) continue;
    if (row.deletedAt !== null || row.effectiveFrom > now) continue;
    if (row.effectiveTo !== null && row.effectiveTo <= now) continue;
    settled.add(row.variantId);
    current.add(row.id);
  }

  const toSet = rows.filter((row) => current.has(row.id) && !row.isCurrent).map((row) => row.id);
  const toClear = rows.filter((row) => row.isCurrent && !current.has(row.id)).map((row) => row.id);

  if (toSet.length > 0) await tx.priceHistory.updateMany({ where: { id: { in: toSet } }, data: { isCurrent: true } });
  if (toClear.length > 0) await tx.priceHistory.updateMany({ where: { id: { in: toClear } }, data: { isCurrent: false } });

  return current;
}

/**
 * Closes each row at the moment the next one starts. Only rows that are still open or that run
 * past their successor are touched, so a row deliberately time-boxed to end early keeps its gap.
 */
async function stitchChain(variantId: number, tx: Prisma.TransactionClient): Promise<void> {
  const rows = await tx.priceHistory.findMany({
    where: { variantId, deletedAt: null },
    orderBy: [{ effectiveFrom: 'asc' }, { id: 'asc' }],
    select: { id: true, effectiveFrom: true, effectiveTo: true },
  });

  for (let index = 0; index < rows.length - 1; index++) {
    const row = rows[index];
    const next = rows[index + 1];
    if (!row || !next) continue;
    const overlapsNext = row.effectiveTo === null || row.effectiveTo > next.effectiveFrom;
    if (overlapsNext) {
      await tx.priceHistory.update({ where: { id: row.id }, data: { effectiveTo: next.effectiveFrom } });
    }
  }
}

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

      // `live` reads the flag, which is indexed; the other two are pure date questions.
      if (filters.state === 'live') {
        where.isCurrent = true;
      } else if (filters.state === 'scheduled') {
        where.effectiveFrom = { ...(where.effectiveFrom as Prisma.DateTimeFilter), gt: new Date() };
      } else if (filters.state === 'ended') {
        where.effectiveTo = { lte: new Date() };
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

    // A staged price becomes current the moment its date passes, which no write is there to
    // notice, so the flag is brought up to date for the variants on this page before they go out.
    const [previous, current] = await Promise.all([
      previousPricesFor(data.map((row) => row.id)),
      syncCurrentFlags(data.map((row) => row.variantId)),
    ]);
    return {
      totalRecord: total,
      data: data.map((row) => toDto({ ...row, isCurrent: current.has(row.id) }, previous.get(row.id) ?? null)),
    };
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

    const [previous, current] = await Promise.all([previousPricesFor(data.map((row) => row.id)), syncCurrentFlags([variantId])]);
    return {
      totalRecord: total,
      data: data.map((row) => toDto({ ...row, isCurrent: current.has(row.id) }, previous.get(row.id) ?? null)),
    };
  }

  async getEffectiveOnMany(variantIds: number[], date: Date, tx: Prisma.TransactionClient = prisma): Promise<Map<number, PriceHistoryDto>> {
    const result = new Map<number, PriceHistoryDto>();
    if (variantIds.length === 0) return result;
    const rows = await tx.priceHistory.findMany({
      where: { variantId: { in: [...new Set(variantIds)] }, ...effectiveOn(date) },
      include: priceHistoryInclude,
      orderBy: EFFECTIVE_ORDER,
    });
    for (const row of rows) {
      if (!result.has(row.variantId)) result.set(row.variantId, toDto(row));
    }
    return result;
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
    // `productId` is denormalised onto the row, so it is read off the variant rather than trusted
    // from the caller - a price can only ever belong to its variant's product.
    const variant = await tx.productVariant.findUnique({ where: { id: data.variantId }, select: { productId: true } });
    if (!variant) throw new Error(`Variant ${data.variantId} not found`);

    await tx.priceHistory.updateMany({
      where: { variantId: data.variantId, effectiveTo: null, effectiveFrom: { lte: effectiveFrom }, deletedAt: null },
      data: { effectiveTo: effectiveFrom },
    });

    const created = await tx.priceHistory.create({
      data: {
        variantId: data.variantId,
        productId: variant.productId,
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

    await syncCurrentFlags([data.variantId], tx);
    return toDto({ ...created, isCurrent: created.effectiveFrom <= new Date() && created.effectiveTo === null });
  }

  /**
   * Corrects a row in place - it does not append. Moving its dates re-stitches the rows either
   * side, so the ledger cannot end up with two prices in force at once.
   */
  async update(id: number, data: UpdatePriceHistoryModel, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto> {
    const run = async (client: Prisma.TransactionClient): Promise<PriceHistoryDto> => {
      const updated = await client.priceHistory.update({
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

      if (data.effectiveFrom !== undefined || data.effectiveTo !== undefined) {
        await stitchChain(updated.variantId, client);
      }
      await syncCurrentFlags([updated.variantId], client);

      const fresh = await client.priceHistory.findUnique({ where: { id }, include: priceHistoryInclude });
      return toDto(fresh ?? updated);
    };

    return tx === prisma ? prisma.$transaction((client) => run(client)) : run(tx);
  }

  /**
   * Removing a row hands its end date back to the row before it, so the period it covered is not
   * left unpriced - without that the variant silently has no price between the two neighbours.
   */
  async delete(id: number, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto> {
    const run = async (client: Prisma.TransactionClient): Promise<PriceHistoryDto> => {
      const deleted = await client.priceHistory.delete({ where: { id }, include: priceHistoryInclude });

      const previous = await client.priceHistory.findFirst({
        where: { variantId: deleted.variantId, deletedAt: null, effectiveFrom: { lte: deleted.effectiveFrom } },
        orderBy: EFFECTIVE_ORDER,
        select: { id: true },
      });
      if (previous) {
        await client.priceHistory.update({ where: { id: previous.id }, data: { effectiveTo: deleted.effectiveTo } });
      }

      await syncCurrentFlags([deleted.variantId], client);
      return toDto(deleted);
    };

    return tx === prisma ? prisma.$transaction((client) => run(client)) : run(tx);
  }

  async getVariantScope(variantId: number, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryVariantScopeDto | null> {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, productId: true, storeCode: true },
    });
    return variant ? { variantId: variant.id, productId: variant.productId, storeCode: variant.storeCode } : null;
  }
}
