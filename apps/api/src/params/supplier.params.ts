import { PageFilterParams } from "./page.params";
import { Status } from "@prisma/client";

export interface SupplierFilterParams extends PageFilterParams {
    status?: Status;
    /** One of SORTABLE_COLUMNS in supplier.repository.ts; anything else falls back to displayOrder. */
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}
