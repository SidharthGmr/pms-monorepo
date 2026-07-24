
import { Status } from "@prisma/client";
import { PageFilterParams } from "./page.params";

export interface StoreFilterParams extends PageFilterParams {
  search?: string;
  status?: Status;
  isActive?: boolean;
}
