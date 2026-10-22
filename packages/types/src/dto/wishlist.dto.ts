import { Status } from '../enum/status.enum';
import { JsonValue } from './product-variant.dto';

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
  attributes?: JsonValue;
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
  addedAt: Date | string;
  product?: WishlistProductDto | null;
  variant?: WishlistVariantDto | null;
  user?: WishlistUserDto | null;
}

/**
 * The body names the SKU and nothing else: the owner comes from the token, and the product
 * and store are read off the variant.
 */
export interface CreateWishlistDto {
  variantId: number;
}

/** Shape of GET /wishlists/has/:productId */
export interface WishlistHasDto {
  productId: number;
  /** Which save was checked: null means the product-level one, not "any SKU". */
  variantId?: number | null;
  inWishlist: boolean;
}

/** Shape of GET /wishlists/has/variant/:variantId */
export interface WishlistVariantHasDto {
  variantId: number;
  inWishlist: boolean;
}
