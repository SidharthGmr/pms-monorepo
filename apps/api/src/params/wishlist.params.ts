import { PageFilterParams } from "./page.params";

export interface WishlistFilterParams extends PageFilterParams {
    /** Set from the token for customers; admins may pass it to inspect one user. */
    userId?: string;
    productId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
