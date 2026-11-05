'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useUpdateSettings } from '@/hooks/service-hooks/useSettingService';
import { useGetMyStore } from '@/hooks/service-hooks/useStoreService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { DEFAULT_INVOICE_TEMPLATE, INVOICE_TEMPLATE_META, InvoiceTemplateKey, SettingsDto } from '@pms/types';
import { Expand, Printer, Save } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { a3PrintScale, InvoiceA3PrintStyle } from './print-style';
import ClassicTemplate from './classic';
import MinimalTemplate from './minimal';
import ModernTemplate from './modern';
import ReceiptTemplate from './receipt';
import TaxTemplate from './tax';
import { InvoiceTemplateProps, withMyStore } from './sample-data';

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';

// The metadata (names, widths) is shared with the API in @pms/types; only the JSX lives here.
const COMPONENTS: Record<InvoiceTemplateKey, React.ComponentType<InvoiceTemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  receipt: ReceiptTemplate,
  tax: TaxTemplate,
};

interface InvoiceTemplatesProps {
  settings: SettingsDto;
}

export default function InvoiceTemplates({ settings }: InvoiceTemplatesProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const updateSettings = useUpdateSettings();

  const savedKey = (INVOICE_TEMPLATE_META.find((meta) => meta.key === settings.invoiceTemplate)?.key ?? DEFAULT_INVOICE_TEMPLATE) as InvoiceTemplateKey;
  const [selectedKey, setSelectedKey] = useState<InvoiceTemplateKey>(savedKey);
  const saving = updateSettings.isPending;

  const selected = INVOICE_TEMPLATE_META.find((meta) => meta.key === selectedKey) ?? INVOICE_TEMPLATE_META[0];
  const SelectedTemplate = COMPONENTS[selected.key];
  // Branding lives on the user's store: the logo plus the masthead details (name, email, phone).
  const { data: myStoreResponse } = useGetMyStore();
  const myStore = myStoreResponse?.data?.data;
  const logoUrl = myStore?.storeLogo ?? undefined;
  const previewInvoice = withMyStore(myStore);
  const printScale = a3PrintScale(selected);

  // The mutation invalidates the settings query, so the page re-reads the saved layout itself.
  const save = async () => {
    try {
      await updateSettings.mutateAsync({ invoiceTemplate: selectedKey });
      toast({ title: 'Default invoice set', description: `New invoices will use the ${selected.name} layout.` });
    } catch (error) {
      toast({ title: 'Save failed', description: unitOfService.ErrorHandlerService.getErrorMessage(error as never), variant: 'destructive' });
    }
  };

  return (
    <div className="grid gap-4 sm:gap-5">
      <div className={cn(SURFACE, 'flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5 print:hidden')}>
        <p className="text-sm text-muted-foreground">Pick the layout invoices are printed and downloaded with. Previews use sample order data with your store&apos;s details and logo.</p>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/invoice-templates/preview?template=${selectedKey}`}>
              <Expand className="mr-1.5 h-4 w-4" />
              Full preview
            </Link>
          </Button>
          <Button variant="outline" size="sm" icon={Printer} iconPlacement="left" onClick={() => window.print()}>
            Print preview
          </Button>
          <Button size="sm" icon={Save} iconPlacement="left" loading={saving} onClick={save} disabled={selectedKey === savedKey || saving}>
            {saving ? 'Saving…' : 'Set as default'}
          </Button>
        </div>
      </div>

      <section className={cn(SURFACE, 'overflow-hidden print:border-0 print:shadow-none')}>
        <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-5 print:hidden">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/60 p-1">
            {INVOICE_TEMPLATE_META.map((meta) => (
              <button
                key={meta.key}
                type="button"
                onClick={() => setSelectedKey(meta.key)}
                aria-pressed={meta.key === selectedKey}
                title={meta.description}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  meta.key === selectedKey ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {meta.name}
                {meta.key === savedKey && <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">Default</span>}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted-foreground">Sample order data</span>
        </div>
        <div className="overflow-x-auto bg-muted/60 p-6 print:bg-white print:p-0">
          <div id="invoice-print-area" className="flex justify-center">
            <div id="invoice-print-sheet">
              <SelectedTemplate invoice={previewInvoice} logoUrl={logoUrl} />
            </div>
          </div>
        </div>
      </section>

      <InvoiceA3PrintStyle scale={printScale} />
    </div>
  );
}
