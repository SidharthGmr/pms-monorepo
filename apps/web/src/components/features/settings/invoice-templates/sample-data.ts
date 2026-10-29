// Static sample invoice used by every template preview, so the designs can be compared on identical content.

export interface SampleInvoiceItem {
  name: string;
  variant?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

export interface SampleInvoice {
  number: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  issuedAt: Date;
  store: { name: string; code: string; address: string; phone: string; email: string };
  customer: { name: string; address: string; phone: string; email: string };
  items: SampleInvoiceItem[];
  discount: number;
  taxRate: number;
  shipping: number;
  payment: { method: string; status: string };
  notes: string;
}

/** Every template takes the same props, so the gallery can swap one for another. */
export interface InvoiceTemplateProps {
  invoice: SampleInvoice;
  /** The admin-uploaded logo; templates fall back to a monogram or plain text when absent. */
  logoUrl?: string;
}

export const money = (value?: number | null) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const underHundred = (n: number): string => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);

// Indian grouping - crore, lakh, thousand - so the words match the digits beside them.
const toWords = (n: number): string => {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (crore) parts.push(`${toWords(crore)} Crore`);
  if (lakh) parts.push(`${underHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${underHundred(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(underHundred(rest));
  return parts.join(' ');
};

export const amountInWords = (value: number): string => {
  const rupees = Math.floor(Math.abs(value));
  const paise = Math.round((Math.abs(value) - rupees) * 100);
  return `${toWords(rupees)} Rupees${paise ? ` and ${underHundred(paise)} Paise` : ''} Only`;
};

export const lineTotal = (item: SampleInvoiceItem) => item.quantity * item.unitPrice;

export const invoiceTotals = (invoice: SampleInvoice) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const taxable = subtotal - invoice.discount;
  const tax = Math.round(taxable * invoice.taxRate * 100) / 100;
  const grandTotal = taxable + tax + invoice.shipping;
  const totalQuantity = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, tax, grandTotal, totalQuantity };
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
    { name: 'Wireless Optical Mouse', variant: 'Black · 1600 DPI', sku: 'MS-1600-BLK', quantity: 2, unitPrice: 649 },
    { name: 'Mechanical Keyboard', variant: 'Blue Switch · TKL', sku: 'KB-MX-BLU', quantity: 1, unitPrice: 2499 },
    { name: 'USB-C Charging Cable 1m', sku: 'CB-UC-100', quantity: 3, unitPrice: 299 },
    { name: 'Aluminium Laptop Stand', variant: 'Silver', sku: 'LS-AL-SLV', quantity: 1, unitPrice: 1299 },
  ],
  discount: 300,
  taxRate: 0.18,
  shipping: 99,
  payment: { method: 'UPI', status: 'Paid' },
  notes: 'Goods once sold are only exchangeable within 7 days with the original invoice.',
};
