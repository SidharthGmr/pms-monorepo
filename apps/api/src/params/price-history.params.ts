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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
