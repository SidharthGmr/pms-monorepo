import { StatusValues } from '@/enums/status-values.enum';

export interface WishlistProductDto {
  id: number;
  name: string;
  slug: string;
  images: string[];
  storeCode: string;
  status: StatusValues | string;
}

export interface WishlistDto {
  id: number;
  userId: string;
  productId: number;
  storeCode: string;
  addedAt: string;
  product?: WishlistProductDto | null;
}

/** Shape of GET /wishlists/has/:productId */
export interface WishlistHasDto {
  productId: number;
  inWishlist: boolean;
}
