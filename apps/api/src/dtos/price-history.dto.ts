/**
 * `PriceHistory` is the price ledger for a `ProductVariant` and the only place a price is
 * stored - the variant itself carries no price columns. The row in force on a date D is the
 * one with the greatest `effectiveFrom <= D` whose `effectiveTo` is null or still in the
 * future; a future-dated row stages a price without making it current.
 */

/** Trimmed product shape carried alongside a price row, for list/detail screens. */
export interface PriceHistoryProductDto {
  id: number;
  name: string;
  slug: string;
}

/** The variant a price row belongs to - also where its tenancy comes from. */
export interface PriceHistoryVariantDto {
  id: number;
  sku: string;
  productId: number;
  storeCode: string;
  product?: PriceHistoryProductDto | null;
}

export interface PriceHistoryDto {
  id: number;
  variantId: number;
  storeCode: string;
  /** Prisma exposes these as `Decimal`; the API contract is plain numbers. */
  sellingPrice: number;
  costPrice: number | null;
  compareAtPrice: number | null;
  effectiveFrom: Date;
  /** Null while this is the row in force; set when a later price supersedes it. */
  effectiveTo: Date | null;
  reason: string | null;
  variant?: PriceHistoryVariantDto | null;
}

/**
 * Just enough of the parent variant to run the store-ownership check without
 * pulling the whole row into the service layer.
 */
export interface PriceHistoryVariantScopeDto {
  variantId: number;
  productId: number;
  storeCode: string;
}

/** Feeds the price-trend widget on a variant/product page. */
export interface PriceHistorySummaryDto {
  variantId: number;
  /** Number of price rows recorded for the variant. */
  changeCount: number;
  /** Price effective right now (latest row with `effectiveFrom <= now`). */
  currentPrice: number | null;
  currentCostPrice: number | null;
  /** Oldest recorded price, so the UI can show the movement since launch. */
  firstPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  averagePrice: number | null;
  firstChangedAt: Date | null;
  lastChangedAt: Date | null;
}
