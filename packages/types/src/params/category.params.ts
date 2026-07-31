import { Status } from "../enum/status.enum";
import { PageFilterParams } from "./page.params";


export interface CategoryFilterParams extends PageFilterParams {
    parentId?: number;
    status?: Status | string;
    /** Include soft-deleted rows. Off by default, so `deletedAt` rows stay hidden. */
    includeDeleted?: boolean;
}
