import { PageFilterParams } from './page.params';

export interface WishlistFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  /** Staff only - the API pins customers to their own list regardless. */
  userId?: string;
  productId?: number;
  /** Sent as ISO strings - they travel to the API as query-string values. */
  startDate?: string;
  endDate?: string;
}
