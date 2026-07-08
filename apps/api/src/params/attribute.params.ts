import { PageFilterParams } from "./page.params";
import { Status } from "@prisma/client";

export interface AttributeFilterParams extends PageFilterParams {
    status?: Status;
}
