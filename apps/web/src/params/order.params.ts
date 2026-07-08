import { PageFilterParams } from "./page.params";

export interface OrderFilterParams extends PageFilterParams {
  customerId?: string;
  storeCode?: string;
  storeId?: number;
  status?: string;
}

export interface OrderItemFilterParams extends PageFilterParams {
  orderId?: number | null;
}
