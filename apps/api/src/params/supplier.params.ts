import { PageFilterParams } from "./page.params";
import { Status } from "@prisma/client";

export interface SupplierFilterParams extends PageFilterParams {
    status?: Status;
}
