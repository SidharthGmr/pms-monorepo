import { ProductVariantResponseDto } from '@pms/types';

/**
 * A variant row as the API reads it internally: the response fields plus the two columns
 * the services need but the client must not see - `storeCode` for the store-ownership
 * guards and `productId` for the NOT NULL stockHistory foreign key.
 *
 * Never return this from a controller; strip it with `toVariantResponse` first.
 */
export interface ProductVariantInternalDto extends ProductVariantResponseDto {
  productId: number;
  storeCode: string;
}

/** Drops the internal-only columns so the trimmed response shape is what ships. */
export function toVariantResponse({ productId, storeCode, ...rest }: ProductVariantInternalDto): ProductVariantResponseDto {
  return rest;
}

/** What a variant's rating looks like after a vote: the caller's own score plus the new average. */
export interface VariantRatingDto {
  variantId: number;
  /** The star rating this user just gave, 1-5. */
  userRating: number;
  /** The variant's average across every rating, one decimal place. */
  rating: number | null;
  ratingCount: number;
}
