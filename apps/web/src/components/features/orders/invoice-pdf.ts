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

// Brand navy and teal, matching --primary / --secondary in globals.css.
const NAVY: [number, number, number] = [9, 42, 85];
const TEAL: [number, number, number] = [2, 169, 143];
const INK: [number, number, number] = [15, 23, 42];
const BODY: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];
const FAINT: [number, number, number] = [148, 163, 184];
const LINE: [number, number, number] = [226, 232, 240];
const HAIR: [number, number, number] = [241, 245, 249];
const SOFT: [number, number, number] = [248, 250, 252];
const ROSE: [number, number, number] = [190, 18, 60];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE = { width: 210, height: 297 };
const MARGIN = 18;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const BODY_BOTTOM = 268;

const COLUMN = {
  index: MARGIN + 3,
  description: MARGIN + 11,
  rateRight: MARGIN + 122,
  qtyCenter: MARGIN + 137,
  amountRight: PAGE.width - MARGIN - 3,
};
const DESCRIPTION_WIDTH = 86;

/**
 * The attribute part of a variant name. Variants are stored as "<product> - <attributes>", but
 * the product half is only sometimes written exactly as the product's own name, so an exact
 * prefix strip leaves the name repeated under itself. Anything before the first " - " is
 * dropped once it opens with the same word as the product.
 */
const variantAttributes = (variantName?: string | null, productName?: string | null): string => {
  const raw = String(variantName ?? '').trim();
  if (!raw) return '';
  const separator = raw.indexOf(' - ');
  if (separator === -1) return raw;

  const head = raw.slice(0, separator).trim().toLowerCase();
  const product = String(productName ?? '').trim().toLowerCase();
  if (!product) return raw;

  const sharesOpening = head.split(/\s+/)[0] === product.split(/\s+/)[0];
  return head === product || product.startsWith(head) || head.startsWith(product) || sharesOpening ? raw.slice(separator + 3).trim() : raw;
};

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

// The word stamped diagonally behind the sheet. Only states worth flagging get one - a plain
// confirmed invoice stays clean.
const WATERMARK: Record<string, string> = {
  DELIVERED: 'PAID',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  PENDING: 'UNPAID',
};

/**
 * The store logo as a data URL, or null when it cannot be fetched. Drawn in place of the
 * monogram when available; a failure here must never stop the invoice downloading.
 * The admin-uploaded logo from Settings wins over the bundled asset.
 */
async function loadLogo(source: string): Promise<{ data: string; ratio: number } | null> {
  try {
    const response = await fetch(source);
    if (!response.ok) return null;
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const ratio = await new Promise<number>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image.width && image.height ? image.width / image.height : 1);
      image.onerror = () => resolve(1);
      image.src = data;
    });
    return { data, ratio };
  } catch {
    return null;
  }
}

export async function downloadInvoicePdf(order: AnyOrder, logoUrl?: string) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  // Falls back to the bundled mark when no logo has been uploaded, or when the upload 404s.
  const logo = (logoUrl ? await loadLogo(logoUrl) : null) ?? (await loadLogo('/logo.png'));

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
  const payment = (order.payments ?? [])[0];
  const paymentLabel = payment?.method ? String(payment.method).replace(/_/g, ' ') : null;

  const label = (text: string, x: number, y: number, align: 'left' | 'right' | 'center' = 'left', colour = FAINT) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.setTextColor(...colour);
    pdf.text(text.toUpperCase(), x, y, { align, charSpace: 0.55 });
  };

  const value = (text: string, x: number, y: number, size = 9, weight: 'normal' | 'bold' = 'normal', colour = BODY, align: 'left' | 'right' | 'center' = 'left') => {
    pdf.setFont('helvetica', weight);
    pdf.setFontSize(size);
    pdf.setTextColor(...colour);
    pdf.text(text, x, y, { align });
  };

  // A hairline pair - one weighted, one faint - reads as a printed rule rather than a border.
  const doubleRule = (atY: number) => {
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN, atY, PAGE.width - MARGIN, atY);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, atY + 0.9, PAGE.width - MARGIN, atY + 0.9);
  };

  // --- Masthead -----------------------------------------------------------
  pdf.setFillColor(...NAVY);
  pdf.rect(0, 0, PAGE.width, 2.2, 'F');
  pdf.setFillColor(...TEAL);
  pdf.rect(0, 0, PAGE.width * 0.32, 2.2, 'F');

  const markTop = 16;
  if (logo) {
    const height = 12;
    pdf.addImage(logo.data, 'PNG', MARGIN, markTop, height * logo.ratio, height, undefined, 'FAST');
  } else {
    pdf.setFillColor(...NAVY);
    pdf.roundedRect(MARGIN, markTop, 12, 12, 2, 2, 'F');
    value(storeName.slice(0, 2).toUpperCase(), MARGIN + 6, markTop + 7.8, 9, 'bold', WHITE, 'center');
  }

  const nameX = MARGIN + (logo ? 12 * logo.ratio + 4 : 16);
  value(storeName, nameX, markTop + 5.5, 13.5, 'bold', INK);
  const storeMeta = [order.store?.code ? `Store ${order.store.code}` : null, order.store?.phone].filter(Boolean).join('  ·  ');
  if (storeMeta) value(storeMeta, nameX, markTop + 10.5, 7.5, 'normal', FAINT);

  label('Tax Invoice', PAGE.width - MARGIN, markTop + 3, 'right', MUTED);
  value(`#${invoiceNumber}`, PAGE.width - MARGIN, markTop + 11.5, 17, 'bold', NAVY, 'right');

  const tone = STATUS_TONE[status] ?? { fill: HAIR, text: MUTED };
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.2);
  const statusWidth = pdf.getTextWidth(status) + 9;
  pdf.setFillColor(...tone.fill);
  pdf.roundedRect(PAGE.width - MARGIN - statusWidth, markTop + 14.5, statusWidth, 5.4, 2.7, 2.7, 'F');
  pdf.setTextColor(...tone.text);
  pdf.text(status, PAGE.width - MARGIN - statusWidth / 2, markTop + 18.2, { align: 'center', charSpace: 0.55 });

  doubleRule(markTop + 24);

  // --- Summary strip ------------------------------------------------------
  let y = markTop + 30;
  pdf.setFillColor(...SOFT);
  pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 2, 2, 'F');
  pdf.setFillColor(...TEAL);
  pdf.rect(MARGIN, y + 2.5, 1.1, 15, 'F');

  const cell = CONTENT_WIDTH / 3;
  label('Invoice date', MARGIN + 7, y + 6.5);
  value(issued, MARGIN + 7, y + 12, 10, 'bold', INK);
  if (issuedTime) value(issuedTime, MARGIN + 7, y + 16.2, 7, 'normal', MUTED);

  label(paymentLabel ? 'Payment' : 'Items', MARGIN + cell + 4, y + 6.5);
  value(paymentLabel ?? `${items.length} ${items.length === 1 ? 'product' : 'products'}`, MARGIN + cell + 4, y + 12, 10, 'bold', INK);
  value(`${items.length} ${items.length === 1 ? 'line' : 'lines'} · ${totalQuantity} qty`, MARGIN + cell + 4, y + 16.2, 7, 'normal', MUTED);

  label('Amount payable', PAGE.width - MARGIN - 7, y + 6.5, 'right');
  value(amount(grandTotal), PAGE.width - MARGIN - 7, y + 13.5, 13.5, 'bold', NAVY, 'right');

  // --- Parties ------------------------------------------------------------
  y += 29;
  const storeLines = [order.store?.address, order.store?.phone, order.store?.email].filter(Boolean) as string[];
  const customerLines = [order.customer?.email, order.customer?.phone].filter(Boolean) as string[];

  const party = (heading: string, name: string, lines: string[], x: number) => {
    label(heading, x, y);
    value(name, x, y + 6, 10.5, 'bold', INK);
    let lineY = y + 11.2;
    if (lines.length === 0) {
      value('No contact details on file', x, lineY, 8, 'normal', FAINT);
      return;
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...BODY);
    for (const line of lines) {
      for (const wrapped of pdf.splitTextToSize(line, CONTENT_WIDTH / 2 - 10) as string[]) {
        pdf.text(wrapped, x, lineY);
        lineY += 4.1;
      }
    }
  };

  party('Billed from', storeName, storeLines, MARGIN);
  party('Billed to', customerName, customerLines, MARGIN + CONTENT_WIDTH / 2 + 6);

  y += 11.2 + Math.max(storeLines.length, customerLines.length, 1) * 4.1 + 10;

  // --- Items table --------------------------------------------------------
  // A tinted band with hairlines reads lighter in print than a solid black header bar, and
  // keeps the page's one heavy element the total.
  const tableHeader = (atY: number) => {
    pdf.setFillColor(...HAIR);
    pdf.rect(MARGIN, atY, CONTENT_WIDTH, 8.5, 'F');
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, atY, PAGE.width - MARGIN, atY);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, atY + 8.5, PAGE.width - MARGIN, atY + 8.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.setTextColor(...NAVY);
    pdf.text('#', COLUMN.index, atY + 5.5, { charSpace: 0.55 });
    pdf.text('DESCRIPTION', COLUMN.description, atY + 5.5, { charSpace: 0.55 });
    pdf.text('RATE', COLUMN.rateRight, atY + 5.5, { align: 'right', charSpace: 0.55 });
    pdf.text('QTY', COLUMN.qtyCenter, atY + 5.5, { align: 'center', charSpace: 0.55 });
    pdf.text('AMOUNT', COLUMN.amountRight, atY + 5.5, { align: 'right', charSpace: 0.55 });
    return atY + 8.5;
  };

  y = tableHeader(y);

  if (items.length === 0) {
    value('No items on this order.', PAGE.width / 2, y + 9, 9, 'normal', FAINT, 'center');
    y += 16;
  }

  items.forEach((item, index) => {
    const name = item.product?.name || `Product #${item.productId}`;
    const variant = variantAttributes(item.variant?.name, item.product?.name);
    const sub = [variant, item.variant?.sku].filter(Boolean).join('  ·  ');
    const lineAmount = (item.unitPrice ?? 0) * (item.quantity ?? 1);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const nameLines = pdf.splitTextToSize(name, DESCRIPTION_WIDTH) as string[];
    const rowHeight = 4.5 + nameLines.length * 4.3 + (sub ? 3.9 : 0);

    // Break on a row boundary, never through one, and carry the header over.
    if (y + rowHeight > BODY_BOTTOM) {
      pdf.addPage();
      y = tableHeader(24);
    }

    if (index % 2 === 1) {
      pdf.setFillColor(252, 253, 254);
      pdf.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'F');
    }

    const textTop = y + 5.6;
    value(String(index + 1).padStart(2, '0'), COLUMN.index, textTop, 7.5, 'normal', FAINT);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...INK);
    nameLines.forEach((line, lineIndex) => pdf.text(line, COLUMN.description, textTop + lineIndex * 4.3));

    if (sub) value(sub, COLUMN.description, textTop + nameLines.length * 4.3 + 0.4, 7.3, 'normal', MUTED);

    value(amount(item.unitPrice), COLUMN.rateRight, textTop, 9, 'normal', BODY, 'right');
    value(String(item.quantity ?? 0), COLUMN.qtyCenter, textTop, 9, 'normal', BODY, 'center');
    value(amount(lineAmount), COLUMN.amountRight, textTop, 9, 'bold', INK, 'right');

    y += rowHeight;
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.15);
    pdf.line(MARGIN, y, PAGE.width - MARGIN, y);
  });

  // --- Totals -------------------------------------------------------------
  const rows: { label: string; text: string; negative?: boolean }[] = [{ label: 'Subtotal', text: amount(subtotal) }];
  if (discount > 0) rows.push({ label: 'Discount', text: `- ${amount(discount)}`, negative: true });
  if (tax > 0) rows.push({ label: 'Tax', text: amount(tax) });
  if (shipping > 0) rows.push({ label: 'Shipping & fees', text: amount(shipping) });

  const words = pdf.splitTextToSize(amountInWords(grandTotal), CONTENT_WIDTH / 2 - 8) as string[];
  const notes = order.notes ? (pdf.splitTextToSize(String(order.notes), CONTENT_WIDTH / 2 - 8) as string[]) : [];
  const totalsHeight = rows.length * 6.2 + 10 + 15;
  const leftHeight = 11 + words.length * 4.2 + (notes.length ? 11 + notes.length * 4 : 0);

  if (y + Math.max(totalsHeight, leftHeight) > BODY_BOTTOM) {
    pdf.addPage();
    y = 24;
  }

  y += 9;
  const totalsX = MARGIN + CONTENT_WIDTH / 2 + 6;
  const totalsWidth = CONTENT_WIDTH / 2 - 6;

  let rowY = y + 5;
  rows.forEach((row) => {
    value(row.label, totalsX + 1, rowY, 8.5, 'normal', MUTED);
    value(row.text, totalsX + totalsWidth, rowY, 8.5, 'bold', row.negative ? ROSE : INK, 'right');
    rowY += 6.2;
  });

  const totalBarY = rowY - 1;
  pdf.setFillColor(...NAVY);
  pdf.roundedRect(totalsX, totalBarY, totalsWidth, 14, 2, 2, 'F');
  pdf.setFillColor(...TEAL);
  pdf.rect(totalsX, totalBarY + 3, 1.1, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.2);
  pdf.setTextColor(...WHITE);
  pdf.text('TOTAL PAYABLE', totalsX + 5, totalBarY + 6, { charSpace: 0.55 });
  value(amount(grandTotal), totalsX + totalsWidth - 5, totalBarY + 11, 14, 'bold', WHITE, 'right');

  // Words, notes and payment sit beside the totals, on the left half.
  label('Amount in words', MARGIN, y);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...BODY);
  words.forEach((line, index) => pdf.text(line, MARGIN, y + 5.5 + index * 4.2));

  let leftY = y + 5.5 + words.length * 4.2 + 7;
  if (paymentLabel) {
    label('Payment', MARGIN, leftY);
    value(`${paymentLabel}${payment?.status ? `  ·  ${String(payment.status).toLowerCase()}` : ''}`, MARGIN, leftY + 5, 8.5, 'normal', BODY);
    leftY += 12;
  }
  if (notes.length) {
    label('Notes', MARGIN, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    notes.forEach((line, index) => pdf.text(line, MARGIN, leftY + 5 + index * 4));
    leftY += 5 + notes.length * 4;
  }

  // --- Signature ----------------------------------------------------------
  const signatureY = Math.max(totalBarY + 14, leftY) + 18;
  if (signatureY < BODY_BOTTOM) {
    pdf.setDrawColor(...FAINT);
    pdf.setLineWidth(0.2);
    pdf.line(PAGE.width - MARGIN - 48, signatureY, PAGE.width - MARGIN, signatureY);
    value(`For ${storeName}`, PAGE.width - MARGIN, signatureY + 4.2, 7.5, 'bold', BODY, 'right');
    value('Authorised signatory', PAGE.width - MARGIN, signatureY + 8.2, 7, 'normal', FAINT, 'right');
    value('Thank you for your business.', MARGIN, signatureY + 4.2, 8.5, 'bold', INK);
    value('This is a computer-generated invoice and does not require a signature.', MARGIN, signatureY + 8.4, 7, 'normal', FAINT);
  }

  // --- Watermark + footer on every page -----------------------------------
  const stamp = WATERMARK[status];
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);

    if (stamp) {
      // Drawn after the content but held far enough back in ink that it never fights the text.
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(74);
      pdf.setTextColor(...NAVY);
      pdf.text(stamp, PAGE.width / 2, PAGE.height / 2 + 18, { align: 'center', angle: 32, charSpace: 2 });
      pdf.restoreGraphicsState();
    }

    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, 281, PAGE.width - MARGIN, 281);
    value(`${storeName}  ·  Invoice #${invoiceNumber}  ·  ${issued}`, MARGIN, 286, 7, 'normal', FAINT);
    value(`Page ${page} of ${pages}`, PAGE.width - MARGIN, 286, 7, 'normal', FAINT, 'right');
  }

  pdf.save(`Invoice-${invoiceNumber}.pdf`);
}
