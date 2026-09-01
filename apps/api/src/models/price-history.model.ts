export interface CreatePriceHistoryModel {
  variantId: number;
  /** Tenancy is stored on the row now, so a price query does not have to join the variant. */
  storeCode: string;
  sellingPrice: number;
  /** Promotional amount for this period. Charged only while the variant's `isOffer` is on. */
  offerPrice?: number | null;
  costPrice?: number | null;
  /** Strike-through / MRP shown next to the selling price. */
  compareAtPrice?: number | null;
  /** Defaults to now. A future date stages a price without making it current. */
  effectiveFrom?: Date;
  reason?: string | null;
  createdById: string;
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
  effectiveFrom?: Date;
  reason?: string | null;
  updatedById?: string;
}
