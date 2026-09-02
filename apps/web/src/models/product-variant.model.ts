import { ProductVariantModel, UpdateProductVariantModel as SharedUpdateProductVariantModel } from '@pms/types';

/**
 * Body accepted by POST /product-variants. Derived from the shared model so the field set has
 * one definition, with three adjustments the wire format needs:
 *  - `storeCode` / `createdById` come from the token, so the browser never sends them,
 *  - `status`, `isActive`, `attributes` and `images` are defaulted by the API when omitted,
 *  - dates travel as ISO strings.
 */
export type CreateProductVariantModel = Omit<
  ProductVariantModel,
  'storeCode' | 'createdById' | 'status' | 'isActive' | 'attributes' | 'images' | 'effectiveFrom' | 'effectiveTo'
> &
  Partial<Pick<ProductVariantModel, 'status' | 'isActive' | 'attributes' | 'images'>> & {
    effectiveFrom?: Date | string;
    effectiveTo?: Date | string | null;
  };

/**
 * Body accepted by PUT /product-variants/:id. Every field is optional - a partial edit never
 * blanks what it did not send. A changed `sellingPrice`/`offerPrice`/`costPrice` is appended to
 * the PriceHistory ledger and a changed `stockQuantity` is booked as a stock adjustment.
 */
export type UpdateProductVariantModel = Omit<SharedUpdateProductVariantModel, 'updatedById' | 'effectiveFrom' | 'effectiveTo'> & {
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string | null;
};

/** Body accepted by POST /product-variants/rating/:id - only the score travels. */
export interface RateProductVariantModel {
  rating: number;
}

/** What the rating endpoint returns: the caller's own score plus the variant's new average. */
export interface VariantRatingDto {
  variantId: number;
  userRating: number;
  rating: number | null;
  ratingCount: number;
}
