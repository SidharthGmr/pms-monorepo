import { OrderStatus } from '../enum/order-status.enum';
import { PageFilterParams } from './page.params';

export interface OrderFilterParams extends PageFilterParams {
  customerId?: string;
  storeId?: number;
  status?: OrderStatus | string;
  /** Only real columns are honoured; anything else falls back to createdAt. */
  sortBy?: string;
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface OrderItemFilterParams extends PageFilterParams {
  orderId?: number | null;
}
