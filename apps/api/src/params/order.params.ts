import { PageFilterParams } from "./page.params";
import { OrderStatus } from "@prisma/client";

export interface OrderFilterParams extends PageFilterParams {
  customerId?: string;
  storeCode?: string;
  storeId?: number;
  status?: OrderStatus;
  /** Only real columns are honoured; anything else falls back to createdAt. */
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
