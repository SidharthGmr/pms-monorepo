import { InvoiceTemplateMeta } from '@pms/types';
import React from 'react';

// Printing targets one A3 portrait sheet: 297mm wide minus 2×12mm @page margins is 273mm ≈ 1032px
// at CSS 96dpi, and the sheet is scaled up from its design width to fill exactly that. The POS
// receipt keeps its natural 80mm-slip size instead of being blown up to the page width.
export const A3_PRINTABLE_WIDTH = 1032;

export const a3PrintScale = (meta: InvoiceTemplateMeta): number =>
  meta.key === 'receipt' ? 1 : Math.round((A3_PRINTABLE_WIDTH / meta.width) * 1000) / 1000;

/*
 * Print contract shared by the gallery and the full-page preview: one A3 portrait sheet.
 * The visibility trick alone leaves the hidden page content occupying height (blank trailing
 * pages), so html/body are collapsed and clipped; the sheet keeps its design width and is
 * scaled from its top-center, which lands its edges exactly on the printable width; the
 * sidebar's gap column keeps its width on paper and SidebarInset is position:relative, so the
 * sheet anchors to the page box with fixed positioning and the sidebar is dropped; color-adjust
 * keeps the colored bars and badges. The markup contract is #invoice-print-area wrapping
 * #invoice-print-sheet wrapping the template.
 */
export function InvoiceA3PrintStyle({ scale }: { scale: number }) {
  return (
    <style>{`
      @media print {
        @page {
          size: A3 portrait;
          margin: 12mm;
        }
        html, body {
          height: auto !important;
          overflow: hidden !important;
          background: #fff !important;
        }
        body * {
          visibility: hidden;
        }
        #invoice-print-area,
        #invoice-print-area * {
          visibility: visible;
        }
        div.peer:has([data-sidebar="sidebar"]) {
          display: none !important;
        }
        #invoice-print-area {
          position: fixed;
          left: 0;
          top: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          zoom: 1 !important;
        }
        #invoice-print-sheet {
          transform: scale(${scale});
          transform-origin: top center;
        }
        #invoice-print-sheet,
        #invoice-print-sheet * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          box-shadow: none !important;
        }
      }
    `}</style>
  );
}
