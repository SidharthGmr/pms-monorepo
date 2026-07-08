import { PageFilterParams } from "./page.params";
 

export interface ProductAttributeFilterParams extends PageFilterParams {
    productId?: number;
    attributeId?: number;
    status?: string | null;
}
