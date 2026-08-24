// Mirrors the API's PriceHistory rows (`/price-histories/...`).
// Append-only ledger: each row is the price that took effect at `effectiveFrom`.
// The variant's own sellingPrice/costPrice is just a cache of the effective row.

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
  sellingPrice: number;
  costPrice: number | null;
  /** ISO string over the wire. */
  effectiveFrom: string;
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
