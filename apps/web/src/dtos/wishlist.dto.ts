import { StatusValues } from '@/enums/status-values.enum';

export interface WishlistProductDto {
  id: number;
  name: string;
  slug: string;
  images: string[];
  storeCode: string;
  status: StatusValues | string;
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
  addedAt: string;
  product?: WishlistProductDto | null;
  user?: WishlistUserDto | null;
}

/** Shape of GET /wishlists/has/:productId */
export interface WishlistHasDto {
  productId: number;
  inWishlist: boolean;
}
