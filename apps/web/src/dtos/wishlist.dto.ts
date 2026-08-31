import { StatusValues } from '@/enums/status-values.enum';

export interface WishlistProductDto {
  id: number;
  name: string;
  slug: string;
  images: string[];
  storeCode: string;
  status: StatusValues | string;
}

/** The exact SKU saved, when the shopper picked one. Absent on a product-level save. */
export interface WishlistVariantDto {
  id: number;
  sku: string;
  name: string | null;
  /** e.g. `{ size: 'L', color: 'Red' }` - what distinguishes this SKU in a listing. */
  attributes?: Record<string, string | number | boolean> | null;
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
  /** Null when the shopper saved the product rather than one of its SKUs. */
  variantId: number | null;
  storeCode: string;
  addedAt: string;
  product?: WishlistProductDto | null;
  variant?: WishlistVariantDto | null;
  user?: WishlistUserDto | null;
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
