

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
