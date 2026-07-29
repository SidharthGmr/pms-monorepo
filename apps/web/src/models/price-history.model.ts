export interface CreatePriceHistoryModel {
  variantId: number;
  sellingPrice: number;
  costPrice?: number | null;
  /** ISO string; omitted means "now". A future date stages the price without making it current. */
  effectiveFrom?: string | null;
  reason?: string | null;
}

/** Corrections only - a real price change should be a new row. */
export interface UpdatePriceHistoryModel {
  sellingPrice?: number;
  costPrice?: number | null;
  effectiveFrom?: string | null;
  reason?: string | null;
}
