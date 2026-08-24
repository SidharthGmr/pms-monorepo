import { PageFilterParams } from './page.params';

/**
 * `startDate`/`endDate` filter on `effectiveFrom` - a price row has no created-at
 * of its own. Sent as ISO strings since they travel as query-string values.
 */
export interface PriceHistoryFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  variantId?: number;
  /** Every price row for a product, across all of its variants. */
  productId?: number;
  minPrice?: number;
  maxPrice?: number;
  /** Only rows that raised or lowered the price against the same variant's previous one. */
  changeDirection?: 'increase' | 'decrease';
  startDate?: string;
  endDate?: string;
}
