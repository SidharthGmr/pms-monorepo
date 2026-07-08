import { PageFilterParams } from "./page.params";
import { Status } from "@prisma/client";

export interface ProductFilterParams extends PageFilterParams {
  categoryId?: number;
  brandNameId?: number;
  storeCode?: string;
  storeId?: number;
  createdById?: string;
  status?: Status;
}
