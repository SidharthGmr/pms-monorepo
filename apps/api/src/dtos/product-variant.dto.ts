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
