/**
 * The read-only shape behind a public share link. Deliberately NOT the admin DTO: it carries
 * no database ids, no storeCode, no customer id, no cost prices and no staff names - only what
 * the recipient of the document is meant to read. Both an estimate and an order map into it,
 * so one public page renders either.
 */

export type PublicDocumentKind = 'ESTIMATE' | 'ORDER';

export interface PublicDocumentStoreDto {
  name: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface PublicDocumentItemDto {
  name: string;
  variantName?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  /** Pre-formatted, e.g. "GST@18%" - the public page never recomputes tax. */
  taxLabel?: string | null;
  lineTotal: number;
}

export interface PublicDocumentTotalsDto {
  subtotal: number;
  itemDiscountTotal: number;
  additionalDiscount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  shippingCharges: number;
  adjustment: number;
  grandTotal: number;
}

export interface PublicDocumentDto {
  kind: PublicDocumentKind;
  number: string;
  status: string;
  issuedAt: Date | string;
  validUntil?: Date | string | null;
  /** Computed server-side so the page never has to reason about validity itself. */
  isExpired?: boolean;
  referenceNumber?: string | null;
  customerName: string;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  terms?: string | null;
  isInterState?: boolean;
  store: PublicDocumentStoreDto;
  items: PublicDocumentItemDto[];
  totals: PublicDocumentTotalsDto;
}

/** What the admin "share" endpoints hand back: the secret and the link built from it. */
export interface ShareLinkDto {
  token: string;
  url: string;
}
