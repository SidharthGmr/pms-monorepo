import { PageFilterParams } from "./page.params";

export interface SupplierFilterParams extends PageFilterParams {
    status?: string | null;
}
