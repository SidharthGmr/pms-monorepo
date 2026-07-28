import { PageFilterParams } from './page.params';

export interface ReviewFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  status?: string | null;
  productId?: number;
  orderId?: number;
  /** Staff only - the API pins customers to their own reviews regardless. */
  userId?: string;
  rating?: number;
  minRating?: number;
  isVerified?: boolean;
  /** Sent as ISO strings - they travel to the API as query-string values. */
  startDate?: string;
  endDate?: string;
}

export interface ReviewReplyFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  reviewId?: number;
  userId?: string;
  startDate?: string;
  endDate?: string;
}
