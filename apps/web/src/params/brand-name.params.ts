import { PageFilterParams } from "./page.params";

 

export interface BrandNameFilterParams extends PageFilterParams {
    status?: string | null;
}
