import { Status } from '@prisma/client';

export interface WishlistProductDto {
    id: number;
    name: string;
    slug: string;
    images: string[];
    storeCode: string;
    status: Status;
}

export interface WishlistDto {
    id: number;
    userId: string;
    productId: number;
    storeCode: string;
    addedAt: Date;
    product?: WishlistProductDto | null;
}

/** The owner comes from the token and the store from the product, so the body only carries the product. */
export interface CreateWishlistDto {
    productId: number;
}
