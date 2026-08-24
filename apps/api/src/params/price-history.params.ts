import { PageFilterParams } from './page.params';

/**
 * `startDate`/`endDate` (from `PageFilterParams`) filter on `effectiveFrom` -
 * `PriceHistory` has no `createdAt` column of its own.
 */
export interface PriceHistoryFilterParams extends PageFilterParams {
  variantId?: number;
  /** Every price row for a product, across all of its variants. */
  productId?: number;
  minPrice?: number;
  maxPrice?: number;
  /**
   * Keep only rows that raised or lowered the price against the same variant's previous
   * one. A variant's first-ever price is neither, so it is excluded by both.
   */
  changeDirection?: 'increase' | 'decrease';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
