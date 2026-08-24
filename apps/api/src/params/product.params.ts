import { PageFilterParams } from "./page.params";
import { Status } from "@prisma/client";

export interface ProductFilterParams extends PageFilterParams {
  categoryId?: number;
  brandNameId?: number;
  storeCode?: string;
  storeId?: number;
  createdById?: string;
  status?: Status;
  /** Only real columns are honoured; price and stock are derived, so they cannot be sorted. */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
