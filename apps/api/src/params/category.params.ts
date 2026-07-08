import { PageFilterParams } from "./page.params";
import { Status } from "@prisma/client";

export interface CategoryFilterParams extends PageFilterParams {
    parentId?: number;
    status?: Status;
}
