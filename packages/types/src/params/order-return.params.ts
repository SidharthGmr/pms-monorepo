import { ReturnStatus } from '../enum/return-status.enum';
import { ReturnType } from '../enum/return-type.enum';
import { PageFilterParams } from './page.params';

export interface OrderReturnFilterParams extends PageFilterParams {
  orderId?: number | null;
  status?: ReturnStatus | string;
  type?: ReturnType | string;
  /** Only real columns are honoured; anything else falls back to createdAt. */
  sortBy?: string;
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC';
}
