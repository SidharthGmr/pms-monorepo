import { Status } from '../enum/status.enum';
import { PageFilterParams } from './page.params';

export interface SupplierFilterParams extends PageFilterParams {
  status?: Status | null;
  /** One of SORTABLE_COLUMNS in supplier.repository.ts; anything else falls back to displayOrder. */
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
