import { PageFilterParams } from "./page.params";
import { OrderStatus } from "@prisma/client";

export interface OrderFilterParams extends PageFilterParams {
  customerId?: string;
  storeCode?: string;
  storeId?: number;
  status?: OrderStatus;
}
