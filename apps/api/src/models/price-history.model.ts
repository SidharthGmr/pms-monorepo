export interface CreatePriceHistoryModel {
  variantId: number;
  sellingPrice: number;
  costPrice?: number | null;
  /** Defaults to now. A future date stages a price without making it current. */
  effectiveFrom?: Date;
  reason?: string | null;
}

/**
 * The ledger is append-only in normal use - this exists for corrections
 * (a typo'd price, a wrong effective date) and is restricted to admins.
 */
export interface UpdatePriceHistoryModel {
  sellingPrice?: number;
  costPrice?: number | null;
  effectiveFrom?: Date;
  reason?: string | null;
}
