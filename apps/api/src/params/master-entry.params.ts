import { Status } from "@prisma/client";
import { PageFilterParams } from "./page.params";

export interface MasterAttributeFilterParams extends PageFilterParams {
    status?: Status;
    code?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface MasterEntryFilterParams extends PageFilterParams {
    status?: Status;
    attributeId?: number;
    /**
     * Filter by the parent attribute's stable code (e.g. "SIZE"). This is what callers
     * across the app use, so they never have to know the numeric attribute id.
     */
    attributeCode?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
