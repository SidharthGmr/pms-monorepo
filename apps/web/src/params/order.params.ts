import { PageFilterParams } from "./page.params";

// Dates travel as ISO strings, the same override product-variant.params.ts makes.
export interface OrderFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  storeCode?: string;
  storeId?: number;
  status?: string;
  /** Only real columns are honoured by the API; anything else falls back to createdAt. */
  sortBy?: string;
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface OrderItemFilterParams extends PageFilterParams {
  orderId?: number | null;
}
