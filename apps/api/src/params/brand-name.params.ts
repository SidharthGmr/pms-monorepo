import { PageFilterParams } from "./page.params";
import { Status } from "@prisma/client";

export interface BrandNameFilterParams extends PageFilterParams {
    status?: Status;
    categoryIds?: number[];
}
