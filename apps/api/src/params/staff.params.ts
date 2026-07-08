import { PageFilterParams } from "./page.params";

export interface StaffFilterParams extends PageFilterParams {
    storeId?: number;
    isActive?: boolean;
    department?: string;
    position?: string;
    storeCode?: string;
}
