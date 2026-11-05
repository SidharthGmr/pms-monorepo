'use client';

import ClassicTemplate from '@/components/features/settings/invoice-templates/classic';
import MinimalTemplate from '@/components/features/settings/invoice-templates/minimal';
import ModernTemplate from '@/components/features/settings/invoice-templates/modern';
import ReceiptTemplate from '@/components/features/settings/invoice-templates/receipt';
import { InvoiceTemplateProps, SampleInvoice } from '@/components/features/settings/invoice-templates/sample-data';
import TaxTemplate from '@/components/features/settings/invoice-templates/tax';
import { DEFAULT_INVOICE_TEMPLATE, INVOICE_TEMPLATE_META, InvoiceTemplateKey } from '@pms/types';
import React from 'react';
import { createRoot } from 'react-dom/client';

const COMPONENTS: Record<InvoiceTemplateKey, React.ComponentType<InvoiceTemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  receipt: ReceiptTemplate,
  tax: TaxTemplate,
};

export const resolveTemplateKey = (value?: string | null): InvoiceTemplateKey =>
  (INVOICE_TEMPLATE_META.find((meta) => meta.key === value)?.key as InvoiceTemplateKey | undefined) ?? DEFAULT_INVOICE_TEMPLATE;

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
 * Renders the chosen invoice template off-screen with the given data, snapshots it and saves
 * a PDF sized to the sheet - so the downloaded bill IS the layout picked under Settings →
 * Invoice Templates, pixel for pixel, receipt strips included.
 */
export async function downloadTemplateBill(templateKey: string | null | undefined, invoice: SampleInvoice, logoUrl?: string, fileName = 'bill.pdf') {
  const key = resolveTemplateKey(templateKey);
  const Template = COMPONENTS[key];
  const sheetWidth = INVOICE_TEMPLATE_META.find((meta) => meta.key === key)?.width ?? 794;

  // Loaded on demand - neither library should sit in the page bundle for everyone.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${sheetWidth}px;background:#ffffff;z-index:-1;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(React.createElement(Template, { invoice, logoUrl }));

    // Two frames so React commits and layout settles, then wait for fonts and the logo.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await (document.fonts?.ready ?? Promise.resolve());
    await imagesSettled(host);

    const canvas = await html2canvas(host, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });

    // One page sized to the sheet (pt = px * 72/96), so A4-ish layouts and narrow receipt
    // strips both come out at their natural proportions.
    const pageWidth = (canvas.width / 2) * 0.75;
    const pageHeight = (canvas.height / 2) * 0.75;
    const pdf = new jsPDF({ orientation: pageWidth > pageHeight ? 'l' : 'p', unit: 'pt', format: [pageWidth, pageHeight] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageWidth, pageHeight);
    pdf.save(fileName);
  } finally {
    root.unmount();
    host.remove();
  }
}
