// Static sample invoice used by every template preview, so the designs can be compared on identical content.

import type { StoreDto } from '@pms/types';

export interface SampleInvoiceItem {
  name: string;
  variant?: string;
  sku?: string;
  hsn?: string;
  quantity: number;
  unitPrice: number;
  /** Discount amount off this line; the Amount column is net of it. */
  discount?: number;
  /** GST attributed to this line, shown in the Tax column. */
  tax?: number;
}

export interface SampleInvoice {
  number: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  issuedAt: Date;
  store: { name: string; code: string; address: string; phone: string; email: string; gstin?: string };
  customer: { name: string; address: string; phone: string; email: string; gstin?: string };
  /** IGST when true, CGST+SGST otherwise. Undefined keeps the single combined GST row. */
  isInterState?: boolean;
  items: SampleInvoiceItem[];
  discount: number;
  taxRate: number;
  /** Exact GST amount when the caller already knows it; overrides the taxRate computation. */
  taxAmount?: number;
  /** True when prices already include GST: the tax row is informational and not added to the total. */
  taxIncluded?: boolean;
  shipping: number;
  /** Amount already paid against this invoice; balance = grand total - received. */
  received: number;
  payment: { method: string; status: string };
  notes: string;
}

/** Every template takes the same props, so the gallery can swap one for another. */
export interface InvoiceTemplateProps {
  invoice: SampleInvoice;
  logoUrl?: string;
}

export { amountInWords } from '@/lib/amount-in-words';

export const money = (value?: number | null) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const lineGross = (item: SampleInvoiceItem) => item.quantity * item.unitPrice;

export const lineTotal = (item: SampleInvoiceItem) => lineGross(item) - (item.discount ?? 0);

export const invoiceTotals = (invoice: SampleInvoice) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const taxable = subtotal - invoice.discount;
  const tax = invoice.taxAmount ?? Math.round(taxable * invoice.taxRate * 100) / 100;
  // Included GST is informational - already inside the prices - so it never adds to the total.
  const grandTotal = taxable + (invoice.taxIncluded ? 0 : tax) + invoice.shipping;
  const totalQuantity = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, tax, grandTotal, totalQuantity };
};

/** The GST row's label: a rate when GST is added on top, a note when it is already in the prices. */
export const taxLabel = (invoice: SampleInvoice) => (invoice.taxIncluded ? 'GST (incl. in price)' : `GST (${invoice.taxRate * 100}%)`);

/**
 * The sample invoice with the signed-in user's own store on the masthead - logo aside (passed
 * separately as logoUrl), the name, email and phone come from the store record. Any field the
 * store has no value for falls back to the sample's, so the preview never shows a gap.
 */
export const withMyStore = (store?: Pick<StoreDto, 'name' | 'code' | 'phone' | 'email' | 'siteName'> | null): SampleInvoice =>
  !store
    ? SAMPLE_INVOICE
    : {
        ...SAMPLE_INVOICE,
        store: {
          name: store.siteName || store.name || SAMPLE_INVOICE.store.name,
          code: store.code || SAMPLE_INVOICE.store.code,
          // Stores no longer keep an address of their own, so the sample's stands in.
          address: SAMPLE_INVOICE.store.address,
          phone: store.phone || SAMPLE_INVOICE.store.phone,
          email: store.email || SAMPLE_INVOICE.store.email,
        },
      };

export const SAMPLE_INVOICE: SampleInvoice = {
  number: 'INV-2026-00148',
  status: 'DELIVERED',
  issuedAt: new Date('2026-10-24T11:35:00'),
  store: {
    name: 'Prime Mart',
    code: 'BLR-01',
    address: '12 MG Road, Indiranagar, Bengaluru 560038',
    phone: '+91 98450 12345',
    email: 'billing@primemart.example',
  },
  customer: {
    name: 'Aarav Sharma',
    address: '48 Lake View Residency, HSR Layout, Bengaluru 560102',
    phone: '+91 99720 44556',
    email: 'aarav.sharma@example.com',
  },
  items: [
    { name: 'Wireless Optical Mouse', variant: 'Black · 1600 DPI', sku: 'MS-1600-BLK', hsn: '8471', quantity: 2, unitPrice: 649, discount: 98, tax: 216 },
    { name: 'Mechanical Keyboard', variant: 'Blue Switch · TKL', sku: 'KB-MX-BLU', hsn: '8471', quantity: 1, unitPrice: 2499, discount: 199, tax: 414 },
    { name: 'USB-C Charging Cable 1m', sku: 'CB-UC-100', hsn: '8544', quantity: 3, unitPrice: 299, tax: 161.46 },
    { name: 'Aluminium Laptop Stand', variant: 'Silver', sku: 'LS-AL-SLV', hsn: '7616', quantity: 1, unitPrice: 1299, tax: 233.82 },
  ],
  discount: 300,
  taxRate: 0.18,
  shipping: 99,
  received: 4000,
  payment: { method: 'UPI', status: 'Paid' },
  notes: 'Goods once sold are only exchangeable within 7 days with the original invoice.',
};
