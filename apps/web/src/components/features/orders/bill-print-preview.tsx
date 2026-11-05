'use client';

import { a3PrintScale, InvoiceA3PrintStyle } from '@/components/features/settings/invoice-templates/print-style';
import { SampleInvoice } from '@/components/features/settings/invoice-templates/sample-data';
import TaxTemplate from '@/components/features/settings/invoice-templates/tax';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { INVOICE_TEMPLATE_META } from '@pms/types';
import { Download, Printer } from 'lucide-react';
import React, { useState } from 'react';
import { downloadTemplateBill } from './template-bill';

// The bill always renders through the Tax Invoice template; its design width drives the A3 print scale.
const TAX_META = INVOICE_TEMPLATE_META.find((meta) => meta.key === 'tax') ?? INVOICE_TEMPLATE_META[INVOICE_TEMPLATE_META.length - 1];

interface BillPrintPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SampleInvoice | null;
  logoUrl?: string;
  fileName?: string;
}

export default function BillPrintPreview({ open, onOpenChange, invoice, logoUrl, fileName = 'bill.pdf' }: BillPrintPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!invoice) return null;

  const downloadPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadTemplateBill(invoice, logoUrl, fileName);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[880px] gap-0 p-0">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>Bill preview</DialogTitle>
            <DialogDescription>Tax Invoice layout with this sale&apos;s details. Print it or download it as a PDF.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-auto bg-muted/60 p-5">
            <div className="mx-auto w-fit shadow-lg">
              <TaxTemplate invoice={invoice} logoUrl={logoUrl} />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t px-5 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={Download}
              iconPlacement="left"
              loading={isDownloading}
              disabled={isDownloading}
              onClick={() => void downloadPdf()}
            >
              Download PDF
            </Button>
            <Button type="button" icon={Printer} iconPlacement="left" onClick={() => window.print()}>
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print copy: stays in the page DOM (hidden on screen) so the A3 contract's fixed positioning anchors to the page box, not the dialog. */}
      {open && (
        <>
          <div id="invoice-print-area" className="hidden">
            <div id="invoice-print-sheet">
              <TaxTemplate invoice={invoice} logoUrl={logoUrl} />
            </div>
          </div>
          <InvoiceA3PrintStyle scale={a3PrintScale(TAX_META)} />
        </>
      )}
    </>
  );
}
