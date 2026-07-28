import { PageFilterParams } from "./page.params";

export interface SupplierFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
    status?: string | null;
    /** Sent as ISO strings — they travel to the API as query-string values. */
    startDate?: string;
    endDate?: string;
}
