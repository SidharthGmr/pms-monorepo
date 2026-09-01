export interface CreatePriceHistoryModel {
  variantId: number;
  storeCode: string;
  sellingPrice: number;
  offerPrice?: number | null;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
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
  effectiveTo?: Date | null;
  reason?: string | null;
  updatedById?: string;
}
