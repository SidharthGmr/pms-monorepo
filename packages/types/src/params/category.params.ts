import { Status } from "../enum/status.enum";
import { PageFilterParams } from "./page.params";


export interface CategoryFilterParams extends PageFilterParams {
    /** `null` lists top-level categories only. */
    parentId?: number | null;
    status?: Status | string;
    /** Include soft-deleted rows. Off by default, so `deletedAt` rows stay hidden. */
    includeDeleted?: boolean;
}
