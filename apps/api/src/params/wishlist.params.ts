import { PageFilterParams } from "./page.params";

export interface WishlistFilterParams extends PageFilterParams {
    /** Set from the token for customers; admins may pass it to inspect one user. */
    userId?: string;
    productId?: number;
    /** Narrows to one SKU. Omitted, a productId filter matches every SKU of that product. */
    variantId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
