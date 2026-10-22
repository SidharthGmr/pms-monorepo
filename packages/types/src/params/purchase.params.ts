import { PageFilterParams } from './page.params';

export interface PurchaseFilterParams extends PageFilterParams {
  sortBy?: string;
  sortDirection?: string;
}
