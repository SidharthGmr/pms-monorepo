import { Status } from "../enum/status.enum";
import { PageFilterParams } from "./page.params";


export interface CategoryFilterParams extends PageFilterParams {
    parentId?: number;
    status?: Status | string;
}
