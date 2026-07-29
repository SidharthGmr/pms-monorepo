import { Status } from '@prisma/client';

export interface WishlistProductDto {
    id: number;
    name: string;
    slug: string;
    images: string[];
    storeCode: string;
    status: Status;
}

/** Who saved the item - staff listings show a name rather than the raw userId. */
export interface WishlistUserDto {
    userId: string;
    name: string;
    email: string;
    profileImageUrl?: string | null;
}

export interface WishlistDto {
    id: number;
    userId: string;
    productId: number;
    storeCode: string;
    addedAt: Date;
    product?: WishlistProductDto | null;
    user?: WishlistUserDto | null;
}

/** The owner comes from the token and the store from the product, so the body only carries the product. */
export interface CreateWishlistDto {
    productId: number;
}
