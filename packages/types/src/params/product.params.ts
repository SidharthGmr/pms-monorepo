import { Status } from '../enum/status.enum';
import { PageFilterParams } from './page.params';

export interface ProductFilterParams extends PageFilterParams {
  categoryId?: number | string | null;
  brandNameId?: number | string | null;
  storeId?: number;
  createdById?: string;
  status?: Status | string | null;
  /** Only real columns are honoured; price and stock are derived, so they cannot be sorted. */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC';
}
