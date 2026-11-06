import { DiscountType } from '../enum/discount.enum';

export interface EstimateItemModel {
  variantId: number;
  quantity: number;
  /** Omitted means "price from the ledger in force on the estimate date". */
  unitPrice?: number | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  /** Omitted means "the tax on the ledger row"; an explicit id overrides it. */
  taxId?: string | null;
}

export interface EstimateModel {
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  estimateDate?: string | Date | null;
  validUntil?: string | Date | null;
  referenceNumber?: string | null;
  notes?: string | null;
  terms?: string | null;
  additionalDiscountType?: DiscountType | null;
  additionalDiscountValue?: number | null;
  shippingCharges?: number | null;
  adjustment?: number | null;
  isInterState?: boolean;
  /** A new estimate can only be born DRAFT (Save Draft) or SENT (Save & Send). */
  status?: 'DRAFT' | 'SENT';
  items: EstimateItemModel[];
}
