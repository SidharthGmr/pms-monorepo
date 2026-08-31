import { Status } from '@prisma/client';

export interface WishlistProductDto {
    id: number;
    name: string;
    slug: string;
    images: string[];
    storeCode: string;
    status: Status;
}

/** The SKU that was saved - what distinguishes one wishlist row from another. */
export interface WishlistVariantDto {
    id: number;
    sku: string;
    name: string | null;
    /** e.g. `{ size: 'L', color: 'Red' }` - what distinguishes this SKU in a listing. */
    attributes: unknown;
    images: string[];
    isActive: boolean;
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
    /** The saved SKU. Every save pins one; the parent product travels alongside it. */
    variantId: number;
    storeCode: string;
    addedAt: Date;
    product?: WishlistProductDto | null;
    variant?: WishlistVariantDto | null;
    user?: WishlistUserDto | null;
}

/**
 * The owner comes from the token and the store from the product, so the body only names what
 * was saved: the SKU, plus the product it belongs to.
 */
export interface CreateWishlistDto {
    productId: number;
    variantId: number;
}
