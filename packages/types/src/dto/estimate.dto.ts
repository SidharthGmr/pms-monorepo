import { DiscountType } from '../enum/discount.enum';
import { EstimateStatus } from '../enum/estimate-status.enum';
import { TaxType } from '../enum/tax.enum';

export interface EstimateItemDto {
  id: number;
  estimateId: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  discountAmount: number;
  taxId?: string | null;
  taxName?: string | null;
  taxRate: number;
  taxType?: TaxType | null;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface EstimateStatusHistoryDto {
  id: number;
  fromStatus?: EstimateStatus | null;
  toStatus: EstimateStatus;
  note?: string | null;
  changedById: string;
  changedByName?: string | null;
  createdAt: Date | string;
}

export interface EstimateDto {
  id: number;
  estimateNumber: string;
  storeCode: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  estimateDate: Date | string;
  validUntil?: Date | string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  terms?: string | null;
  status: EstimateStatus;
  subtotal: number;
  itemDiscountTotal: number;
  additionalDiscountType?: DiscountType | null;
  additionalDiscountValue?: number | null;
  additionalDiscount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  shippingCharges: number;
  adjustment: number;
  grandTotal: number;
  isInterState: boolean;
  convertedOrderId?: number | null;
  convertedAt?: Date | string | null;
  createdById: string;
  createdByName?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
  items?: EstimateItemDto[];
  statusHistory?: EstimateStatusHistoryDto[];
  convertedOrder?: { id: number; orderNumber: string } | null;
  store?: {
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    siteName?: string | null;
    storeLogo?: string | null;
  };
}
