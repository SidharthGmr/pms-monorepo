import { ProductVariantInternalDto, ProductVariantResponseDto } from '@pms/types';

/** Drops the internal-only columns so the trimmed response shape is what ships. */
export function toVariantResponse({ productId, storeCode, ...rest }: ProductVariantInternalDto): ProductVariantResponseDto {
  return rest;
}
