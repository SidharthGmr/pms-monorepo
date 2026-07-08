import { PageFilterParams } from "./page.params";
 

export interface ProductVariantFilterParams extends PageFilterParams {
    productId?: number;
    status?: string | null;
}
