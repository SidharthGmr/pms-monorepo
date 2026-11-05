'use client';

import { InvoiceTemplateProps, SampleInvoice } from '@/components/features/settings/invoice-templates/sample-data';
import TaxTemplate from '@/components/features/settings/invoice-templates/tax';
import { INVOICE_TEMPLATE_META } from '@pms/types';
import React from 'react';
import { createRoot } from 'react-dom/client';

// The downloaded bill is ALWAYS the Tax Invoice layout - the GST-style ruled sheet - exactly
// as it renders under Settings → Invoice Templates → Tax Invoice.
const Template: React.ComponentType<InvoiceTemplateProps> = TaxTemplate;
const SHEET_WIDTH = INVOICE_TEMPLATE_META.find((meta) => meta.key === 'tax')?.width ?? 794;

/** Resolves once every <img> inside the node has either loaded or failed. */
const imagesSettled = (node: HTMLElement) =>
  Promise.all(
    Array.from(node.querySelectorAll('img')).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        })
    )
  );

/**
 * Renders the Tax Invoice template off-screen with the given data and snapshots it into a
 * jsPDF document sized to the sheet - the bill matches the template preview pixel for pixel.
 */
async function renderBillPdf(invoice: SampleInvoice, logoUrl?: string) {
  // Loaded on demand - neither library should sit in the page bundle for everyone.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${SHEET_WIDTH}px;background:#ffffff;z-index:-1;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(React.createElement(Template, { invoice, logoUrl }));

    // Two frames so React commits and layout settles, then wait for fonts and the logo.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await (document.fonts?.ready ?? Promise.resolve());
    await imagesSettled(host);

    const canvas = await html2canvas(host, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });

    // One page sized to the sheet (pt = px * 72/96), at its natural proportions.
    const pageWidth = (canvas.width / 2) * 0.75;
    const pageHeight = (canvas.height / 2) * 0.75;
    const pdf = new jsPDF({ orientation: pageWidth > pageHeight ? 'l' : 'p', unit: 'pt', format: [pageWidth, pageHeight] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageWidth, pageHeight);
    return pdf;
  } finally {
    root.unmount();
    host.remove();
  }
}

/** Saves the bill as a file. */
export async function downloadTemplateBill(invoice: SampleInvoice, logoUrl?: string, fileName = 'bill.pdf') {
  const pdf = await renderBillPdf(invoice, logoUrl);
  pdf.save(fileName);
}
