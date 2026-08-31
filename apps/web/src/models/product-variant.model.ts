// Body accepted by POST /product-variants. `storeCode` and `createdById` are
// taken from the authenticated user's token, so they are not sent.
export interface CreateProductVariantModel {
  productId: number;
  sku?: string;
  name?: string;
  images?: string[];
  attributes?: Record<string, string | number | boolean>;
  stockQuantity?: number;
  sellingPrice: number;
  costPrice?: number | null;
  effectiveFrom?: Date | string;
  reason?: string | null;
  supersedePrevious?: boolean;
}

/**
 * Body accepted by PUT /product-variants/:id. Plain columns are written directly; a changed
 * `sellingPrice`/`costPrice` is appended to the PriceHistory ledger, and a changed
 * `stockQuantity` (target on-hand) is booked as a stock adjustment — the API handles both.
 */
/**
 * Body accepted by POST /product-variants/rating/:id. The rater comes from the token and the
 * store from the variant, so only the score travels.
 */
export interface RateProductVariantModel {
  rating: number;
}

/** What the rating endpoint returns: the caller's own score plus the variant's new average. */
export interface VariantRatingDto {
  variantId: number;
  userRating: number;
  /** Average across every rating; null when the variant has never been rated. */
  rating: number | null;
  ratingCount: number;
}

export interface UpdateProductVariantModel {
  name?: string | null;
  sku?: string;
  barcode?: string | null;
  attributes?: Record<string, string | number | boolean>;
  images?: string[];
  lowStockThreshold?: number | null;
  isActive?: boolean;
  sellingPrice?: number;
  costPrice?: number | null;
  effectiveFrom?: string | null;
  stockQuantity?: number | null;
  reason?: string | null;
}
