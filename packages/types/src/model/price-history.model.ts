import { DiscountType } from "../enum/discount.enum";
import { TaxType } from "../enum/tax.enum";

export interface CreatePriceHistoryModel {
  variantId: number;
  storeCode?: string;
  sellingPrice: number;
  wholesalePrice?: number | null;
  isOffer?: boolean;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  purchaseTaxType?: TaxType | null;
  wholesaleTaxType?: TaxType | null;
  saleTaxType?: TaxType | null;
  taxId?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  reason?: string | null;
  createdById?: string;
}

/**
 * The ledger is append-only in normal use - this exists for corrections
 * (a typo'd price, a wrong effective date) and is restricted to admins.
 */
export interface UpdatePriceHistoryModel {
  sellingPrice?: number;
  wholesalePrice?: number | null;
  isOffer?: boolean;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  reason?: string | null;
  updatedById?: string;
}
