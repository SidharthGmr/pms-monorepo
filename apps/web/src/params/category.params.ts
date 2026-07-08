 
import { PageFilterParams } from "./page.params"; 

export interface CategoryFilterParams extends PageFilterParams {
    parentId?: number;
     status?: string | null;
}
