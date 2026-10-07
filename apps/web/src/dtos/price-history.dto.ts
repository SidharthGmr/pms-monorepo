// Mirrors the API's PriceHistory rows (`/price-histories/...`).
// Append-only ledger: each row is the price that took effect at `effectiveFrom`.
// The ledger is the only place a price lives - the variant has no price column to cache it.

export interface PriceHistoryProductDto {
  id: number;
  name: string;
  slug: string;
}

/** The variant a price row belongs to - also where its store scoping comes from. */
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
  productId: number;
  storeCode: string;
  sellingPrice: number;
  /** The promotional amount for this period; charged only while the variant's `isOffer` is on. */
  offerPrice: number | null;
  costPrice: number | null;
  compareAtPrice: number | null;
  /** ISO string over the wire. */
  effectiveFrom: string;
  /** Null while this is the row in force; set when a later price supersedes it. */
  effectiveTo: string | null;
  /**
   * True on the single row per variant in force right now. Maintained by the API from the dates,
   * so the client never has to compare `effectiveFrom`/`effectiveTo` itself.
   */
  isCurrent: boolean;
  reason: string | null;
  /** The price this row replaced, resolved by the API. Null on a variant's first price. */
  previousPrice: number | null;
  variant?: PriceHistoryVariantDto | null;
}

/** Backs the summary tiles above the ledger. */
export interface PriceHistorySummaryDto {
  variantId: number;
  changeCount: number;
  currentPrice: number | null;
  currentCostPrice: number | null;
  firstPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  averagePrice: number | null;
  firstChangedAt: string | null;
  lastChangedAt: string | null;
}
