import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ListResponseDto } from '../dtos/list-response.dto';
import { PriceHistoryDto, PriceHistorySummaryDto, PriceHistoryVariantScopeDto } from '../dtos/price-history.dto';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '../models/price-history.model';
import { PriceHistoryFilterParams } from '../params/price-history.params';
import { IPriceHistoryRepository } from './interfaces/iprice-history.repository';

// PriceHistory has no storeCode of its own - it is scoped through the variant the
// row belongs to, so every tenant filter goes through the relation.
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
function toDto(row: PriceHistoryWithVariant): PriceHistoryDto {
  return {
    id: row.id,
    variantId: row.variantId,
    sellingPrice: row.sellingPrice.toNumber(),
    costPrice: row.costPrice?.toNumber() ?? null,
    effectiveFrom: row.effectiveFrom,
    reason: row.reason,
    variant: row.variant,
  };
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

      // Tenancy lives on the variant, not on the price row.
      if (filters.storeCode !== undefined) variantWhere.storeCode = filters.storeCode;

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

    return { totalRecord: total, data: data.map(toDto) };
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

    return { totalRecord: total, data: data.map(toDto) };
  }

  async getEffectiveOn(variantId: number, date: Date, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto | null> {
    const row = await tx.priceHistory.findFirst({
      where: { variantId, effectiveFrom: { lte: date } },
      include: priceHistoryInclude,
      // Two rows can share an effective date; the later-recorded one wins.
      orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
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
        where: { variantId, effectiveFrom: { lte: new Date() } },
        orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
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

  async create(data: CreatePriceHistoryModel, tx: Prisma.TransactionClient = prisma): Promise<PriceHistoryDto> {
    const created = await tx.priceHistory.create({
      data: {
        variantId: data.variantId,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice ?? null,
        effectiveFrom: data.effectiveFrom ?? new Date(),
        reason: data.reason ?? null,
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
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.effectiveFrom !== undefined && { effectiveFrom: data.effectiveFrom }),
        ...(data.reason !== undefined && { reason: data.reason || null }),
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

  async syncVariantPrice(variantId: number, tx: Prisma.TransactionClient = prisma): Promise<void> {
    const effective = await tx.priceHistory.findFirst({
      where: { variantId, effectiveFrom: { lte: new Date() } },
      orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
    });

    // Nothing effective yet (ledger empty, or every row is future-dated) - leave
    // the variant's own price alone rather than zeroing it out.
    if (!effective) return;

    await tx.productVariant.update({
      where: { id: variantId },
      data: { sellingPrice: effective.sellingPrice, costPrice: effective.costPrice },
    });
  }
}
