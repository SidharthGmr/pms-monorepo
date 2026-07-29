import { Prisma } from '@prisma/client';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { PriceHistoryDto, PriceHistorySummaryDto } from '../../dtos/price-history.dto';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '../../models/price-history.model';
import { PriceHistoryFilterParams } from '../../params/price-history.params';

/**
 * Every method takes the caller's `storeCode` (from the token) so the service can
 * reject rows belonging to another tenant - `PriceHistory` itself has no store
 * column, the check always goes through the parent variant.
 */
export interface IPriceHistoryService {
  getAll(filters?: PriceHistoryFilterParams): Promise<ListResponseDto<PriceHistoryDto>>;
  getById(id: number, storeCode: string): Promise<PriceHistoryDto | null>;
  getByVariant(variantId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<PriceHistoryDto>>;
  getEffectiveOn(variantId: number, date: Date, storeCode: string, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto | null>;
  getSummary(variantId: number, storeCode: string): Promise<PriceHistorySummaryDto>;

  /**
   * Appends a price row and refreshes the variant's denormalized current price
   * when the new row is the effective one.
   */
  create(data: CreatePriceHistoryModel, storeCode: string, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto>;

  /** Correction path (admin only at the route level); resyncs the variant cache. */
  update(id: number, data: UpdatePriceHistoryModel, storeCode: string): Promise<PriceHistoryDto>;

  /** Hard delete plus a resync, so removing the newest row restores the previous price. */
  delete(id: number, storeCode: string): Promise<PriceHistoryDto>;
}
