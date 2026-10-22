export interface CreatePriceHistoryModel {
  variantId: number;
  /** Set server-side from the variant; clients never send it. */
  storeCode?: string;
  sellingPrice: number;
  offerPrice?: number | null;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  /** ISO string or Date; omitted means "now". A future date stages the price without making it current. */
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  reason?: string | null;
  /** Stamped from the token server-side. */
  createdById?: string;
}

/**
 * The ledger is append-only in normal use - this exists for corrections
 * (a typo'd price, a wrong effective date) and is restricted to admins.
 */
export interface UpdatePriceHistoryModel {
  sellingPrice?: number;
  offerPrice?: number | null;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  reason?: string | null;
  updatedById?: string;
}
