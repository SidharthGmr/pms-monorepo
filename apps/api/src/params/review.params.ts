import { Status } from "@prisma/client";
import { PageFilterParams } from "./page.params";

export interface ReviewFilterParams extends PageFilterParams {
    status?: Status;
    productId?: number;
    orderId?: number;
    /** Restricts the list to one reviewer - set from the token for customers. */
    userId?: string;
    rating?: number;
    minRating?: number;
    isVerified?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ReviewReplyFilterParams extends PageFilterParams {
    reviewId?: number;
    userId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
