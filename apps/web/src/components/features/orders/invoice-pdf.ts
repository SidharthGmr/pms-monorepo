import config from '@/config';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

/**
 * The invoice is drawn with jsPDF's own primitives rather than screenshotted with html2canvas.
 * That keeps the text real text - selectable, searchable and sharp at any zoom - puts the file
 * in the tens of kilobytes instead of a megabyte, and lets the table break across pages on a row
 * boundary with its header repeated, which a sliced bitmap cannot do.
 *
 * jsPDF's built-in fonts are WinAnsi-encoded and have no U+20B9, so the rupee sign would print
 * as a stray glyph. Amounts use "Rs." here; the on-screen bill keeps the symbol.
 */

type AnyOrder = Record<string, any>;

const INK: [number, number, number] = [15, 23, 42];
const BODY: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];
const FAINT: [number, number, number] = [148, 163, 184];
const LINE: [number, number, number] = [226, 232, 240];
const SOFT: [number, number, number] = [248, 250, 252];
const ROSE: [number, number, number] = [225, 29, 72];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE = { width: 210, height: 297 };
const MARGIN = 16;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const BODY_BOTTOM = 272;

const COLUMN = {
  index: MARGIN,
  description: MARGIN + 8,
  rateRight: MARGIN + 126,
  qtyCenter: MARGIN + 140,
  amountRight: PAGE.width - MARGIN,
};
const DESCRIPTION_WIDTH = 92;

const amount = (value?: number | null) => `Rs. ${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

const STATUS_TONE: Record<string, { fill: [number, number, number]; text: [number, number, number] }> = {
  PENDING: { fill: [254, 243, 199], text: [180, 83, 9] },
  CONFIRMED: { fill: [224, 242, 254], text: [3, 105, 161] },
  SHIPPED: { fill: [224, 231, 255], text: [67, 56, 202] },
  DELIVERED: { fill: [209, 250, 229], text: [4, 120, 87] },
  CANCELLED: { fill: [255, 228, 230], text: [190, 18, 60] },
  RETURNED: { fill: [255, 237, 213], text: [194, 65, 12] },
};

export function downloadInvoicePdf(order: AnyOrder) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const items: AnyOrder[] = order.items ?? [];
  const storeName = order.store?.name || config.appName;
  const customerName = order.customer?.name || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Walk-in customer';
  const status = String(order.status ?? 'CONFIRMED').toUpperCase();
  const issued = order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : '-';
  const issuedTime = order.createdAt ? format(new Date(order.createdAt), 'h:mm a') : '';
  const invoiceNumber = String(order.orderNumber || order.id || '');

  const subtotal = Number(order.totalAmount ?? 0);
  const discount = Number(order.discount ?? 0);
  const tax = Number(order.tax ?? 0);
  const shipping = Number(order.shippingCost ?? 0);
  const grandTotal = Number(order.grandTotal ?? 0);
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  const label = (text: string, x: number, y: number, align: 'left' | 'right' | 'center' = 'left') => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...FAINT);
    pdf.text(text.toUpperCase(), x, y, { align, charSpace: 0.3 });
  };

  const value = (text: string, x: number, y: number, size = 9, weight: 'normal' | 'bold' = 'normal', colour = BODY, align: 'left' | 'right' | 'center' = 'left') => {
    pdf.setFont('helvetica', weight);
    pdf.setFontSize(size);
    pdf.setTextColor(...colour);
    pdf.text(text, x, y, { align });
  };

  // --- Masthead -----------------------------------------------------------
  pdf.setFillColor(...INK);
  pdf.rect(0, 0, PAGE.width, 3, 'F');

  pdf.setFillColor(...INK);
  pdf.roundedRect(MARGIN, 14, 11, 11, 1.8, 1.8, 'F');
  value(storeName.slice(0, 2).toUpperCase(), MARGIN + 5.5, 21.2, 9, 'bold', WHITE, 'center');

  value(storeName, MARGIN + 14, 19.5, 13, 'bold', INK);
  if (order.store?.code) value(`Store ${order.store.code}`, MARGIN + 14, 24, 7.5, 'normal', FAINT);

  label('Tax Invoice', PAGE.width - MARGIN, 17, 'right');
  value(`#${invoiceNumber}`, PAGE.width - MARGIN, 24, 16, 'bold', INK, 'right');

  const tone = STATUS_TONE[status] ?? { fill: [241, 245, 249] as [number, number, number], text: MUTED };
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  const statusWidth = pdf.getTextWidth(status) + 7;
  pdf.setFillColor(...tone.fill);
  pdf.roundedRect(PAGE.width - MARGIN - statusWidth, 26.5, statusWidth, 5, 2.5, 2.5, 'F');
  pdf.setTextColor(...tone.text);
  pdf.text(status, PAGE.width - MARGIN - statusWidth / 2, 30, { align: 'center', charSpace: 0.3 });

  // --- Summary strip ------------------------------------------------------
  let y = 38;
  pdf.setFillColor(...SOFT);
  pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 17, 1.5, 1.5, 'F');

  const cell = CONTENT_WIDTH / 3;
  label('Invoice date', MARGIN + 6, y + 6);
  value(issued, MARGIN + 6, y + 11, 9.5, 'bold', INK);
  if (issuedTime) value(issuedTime, MARGIN + 6, y + 14.8, 7, 'normal', MUTED);

  label('Items', MARGIN + cell + 6, y + 6);
  value(`${items.length} ${items.length === 1 ? 'product' : 'products'}`, MARGIN + cell + 6, y + 11, 9.5, 'bold', INK);
  value(`${totalQuantity} qty in total`, MARGIN + cell + 6, y + 14.8, 7, 'normal', MUTED);

  label('Amount payable', PAGE.width - MARGIN - 6, y + 6, 'right');
  value(amount(grandTotal), PAGE.width - MARGIN - 6, y + 11.5, 12, 'bold', INK, 'right');

  // --- Parties ------------------------------------------------------------
  y += 26;
  const storeLines = [order.store?.address, order.store?.phone, order.store?.email].filter(Boolean) as string[];
  const customerLines = [order.customer?.email, order.customer?.phone].filter(Boolean) as string[];

  const party = (heading: string, name: string, lines: string[], x: number) => {
    label(heading, x, y);
    value(name, x, y + 5.5, 10, 'bold', INK);
    let lineY = y + 10.5;
    if (lines.length === 0) {
      value('No contact details on file', x, lineY, 8, 'normal', FAINT);
      return;
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...BODY);
    for (const line of lines) {
      for (const wrapped of pdf.splitTextToSize(line, CONTENT_WIDTH / 2 - 8) as string[]) {
        pdf.text(wrapped, x, lineY);
        lineY += 4;
      }
    }
  };

  party('From', storeName, storeLines, MARGIN);
  party('Bill to', customerName, customerLines, MARGIN + CONTENT_WIDTH / 2 + 4);

  y += 10.5 + Math.max(storeLines.length, customerLines.length, 1) * 4 + 8;

  // --- Items table --------------------------------------------------------
  const tableHeader = (atY: number) => {
    pdf.setFillColor(...INK);
    pdf.roundedRect(MARGIN, atY, CONTENT_WIDTH, 8, 1.2, 1.2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...WHITE);
    pdf.text('#', COLUMN.index + 2, atY + 5.2, { charSpace: 0.3 });
    pdf.text('DESCRIPTION', COLUMN.description + 2, atY + 5.2, { charSpace: 0.3 });
    pdf.text('RATE', COLUMN.rateRight, atY + 5.2, { align: 'right', charSpace: 0.3 });
    pdf.text('QTY', COLUMN.qtyCenter, atY + 5.2, { align: 'center', charSpace: 0.3 });
    pdf.text('AMOUNT', COLUMN.amountRight - 2, atY + 5.2, { align: 'right', charSpace: 0.3 });
    return atY + 8;
  };

  y = tableHeader(y);

  if (items.length === 0) {
    value('No items on this order.', PAGE.width / 2, y + 9, 9, 'normal', FAINT, 'center');
    y += 16;
  }

  items.forEach((item, index) => {
    const name = item.product?.name || `Product #${item.productId}`;
    const variant = item.variant?.name && item.product?.name ? String(item.variant.name).replace(`${item.product.name} - `, '') : item.variant?.name;
    const sub = [variant, item.variant?.sku].filter(Boolean).join(' - ');
    const lineAmount = (item.unitPrice ?? 0) * (item.quantity ?? 1);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const nameLines = pdf.splitTextToSize(name, DESCRIPTION_WIDTH) as string[];
    const rowHeight = 4 + nameLines.length * 4.2 + (sub ? 3.8 : 0);

    // Break on a row boundary, never through one, and carry the header over.
    if (y + rowHeight > BODY_BOTTOM) {
      pdf.addPage();
      y = tableHeader(22);
    }

    const textTop = y + 5.4;
    value(String(index + 1), COLUMN.index + 2, textTop, 8, 'normal', FAINT);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...INK);
    nameLines.forEach((line, lineIndex) => pdf.text(line, COLUMN.description + 2, textTop + lineIndex * 4.2));

    if (sub) value(sub, COLUMN.description + 2, textTop + nameLines.length * 4.2 + 0.4, 7.5, 'normal', MUTED);

    value(amount(item.unitPrice), COLUMN.rateRight, textTop, 9, 'normal', BODY, 'right');
    value(String(item.quantity ?? 0), COLUMN.qtyCenter, textTop, 9, 'normal', BODY, 'center');
    value(amount(lineAmount), COLUMN.amountRight - 2, textTop, 9, 'bold', INK, 'right');

    y += rowHeight;
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, y, PAGE.width - MARGIN, y);
  });

  // --- Totals -------------------------------------------------------------
  const rows: { label: string; text: string; negative?: boolean }[] = [{ label: 'Subtotal', text: amount(subtotal) }];
  if (discount > 0) rows.push({ label: 'Discount', text: `- ${amount(discount)}`, negative: true });
  if (tax > 0) rows.push({ label: 'Tax', text: amount(tax) });
  if (shipping > 0) rows.push({ label: 'Shipping & fees', text: amount(shipping) });

  const words = pdf.splitTextToSize(amountInWords(grandTotal), CONTENT_WIDTH / 2 - 6) as string[];
  const notes = order.notes ? (pdf.splitTextToSize(String(order.notes), CONTENT_WIDTH / 2 - 6) as string[]) : [];
  const totalsHeight = rows.length * 6 + 10 + 14;
  const leftHeight = 10 + words.length * 4.2 + (notes.length ? 10 + notes.length * 4 : 0);

  if (y + Math.max(totalsHeight, leftHeight) > BODY_BOTTOM) {
    pdf.addPage();
    y = 22;
  }

  y += 8;
  const totalsX = MARGIN + CONTENT_WIDTH / 2 + 4;
  const totalsWidth = CONTENT_WIDTH / 2 - 4;

  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(totalsX, y, totalsWidth, rows.length * 6 + 5, 1.5, 1.5, 'S');

  let rowY = y + 7.5;
  rows.forEach((row) => {
    value(row.label, totalsX + 5, rowY, 8.5, 'normal', MUTED);
    value(row.text, totalsX + totalsWidth - 5, rowY, 8.5, 'bold', row.negative ? ROSE : INK, 'right');
    rowY += 6;
  });

  const totalBarY = y + rows.length * 6 + 7;
  pdf.setFillColor(...INK);
  pdf.roundedRect(totalsX, totalBarY, totalsWidth, 13, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(...WHITE);
  pdf.text('TOTAL', totalsX + 5, totalBarY + 5.5, { charSpace: 0.3 });
  value(amount(grandTotal), totalsX + totalsWidth - 5, totalBarY + 9.6, 14, 'bold', WHITE, 'right');

  // Words and notes sit beside the totals, on the left half.
  label('Amount in words', MARGIN, y + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...BODY);
  words.forEach((line, index) => pdf.text(line, MARGIN, y + 8.5 + index * 4.2));

  if (notes.length) {
    const notesY = y + 8.5 + words.length * 4.2 + 6;
    label('Notes', MARGIN, notesY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    notes.forEach((line, index) => pdf.text(line, MARGIN, notesY + 5 + index * 4));
  }

  // --- Signature + footer on every page -----------------------------------
  const signatureY = Math.max(totalBarY + 13, y + leftHeight) + 16;
  if (signatureY < BODY_BOTTOM) {
    pdf.setDrawColor(...LINE);
    pdf.line(PAGE.width - MARGIN - 45, signatureY, PAGE.width - MARGIN, signatureY);
    value('Authorised signatory', PAGE.width - MARGIN, signatureY + 4, 7.5, 'normal', MUTED, 'right');
    value('This is a computer-generated invoice and does not require a signature.', MARGIN, signatureY + 4, 7.5, 'normal', FAINT);
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, 283, PAGE.width - MARGIN, 283);
    value(`${storeName} - Invoice #${invoiceNumber} - ${issued}`, MARGIN, 288, 7, 'normal', FAINT);
    value(`Page ${page} of ${pages}`, PAGE.width - MARGIN, 288, 7, 'normal', FAINT, 'right');
  }

  pdf.save(`Invoice-${invoiceNumber}.pdf`);
}
