import { Prisma } from '@prisma/client';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { PriceHistoryDto, PriceHistorySummaryDto, PriceHistoryVariantScopeDto } from '../../dtos/price-history.dto';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '../../models/price-history.model';
import { PriceHistoryFilterParams } from '../../params/price-history.params';

export interface IPriceHistoryRepository {
  findAll(filters?: PriceHistoryFilterParams): Promise<ListResponseDto<PriceHistoryDto>>;

  /** Pass `tx` when reading back a row written inside an open transaction. */
  findById(id: number, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto | null>;

  /** Paginated ledger for one variant, newest effective date first. */
  findByVariant(variantId: number, page?: number, limit?: number): Promise<ListResponseDto<PriceHistoryDto>>;

  /**
   * The price in force on a given date: the row with the greatest `effectiveFrom` that is
   * <= date and not yet superseded. Used to price a sale, including a backdated one.
   */
  getEffectiveOn(variantId: number, date: Date, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto | null>;

  /** Min/max/average/current price for a variant - drives the trend widget. */
  getSummary(variantId: number): Promise<PriceHistorySummaryDto>;

  create(data: CreatePriceHistoryModel, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto>;

  /** Correction path only; the ledger is append-only in normal use. */
  update(id: number, data: UpdatePriceHistoryModel, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto>;

  /** Hard delete - `PriceHistory` has no status/deletedAt column to soft-delete into. */
  delete(id: number, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto>;

  /**
   * Tenancy for a price row lives on its variant, so the service needs the
   * parent's `storeCode` before it can allow a read or a write.
   */
  getVariantScope(variantId: number, tx?: Prisma.TransactionClient): Promise<PriceHistoryVariantScopeDto | null>;
}
