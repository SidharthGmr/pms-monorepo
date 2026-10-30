'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useUpdateSettings } from '@/hooks/service-hooks/useSettingService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { DEFAULT_INVOICE_TEMPLATE, INVOICE_TEMPLATE_META, InvoiceTemplateKey, SettingsDto } from '@pms/types';
import { Check, Printer, Save } from 'lucide-react';
import React, { useState } from 'react';
import ClassicTemplate from './classic';
import MinimalTemplate from './minimal';
import ModernTemplate from './modern';
import ReceiptTemplate from './receipt';
import TaxTemplate from './tax';
import { InvoiceTemplateProps, SAMPLE_INVOICE } from './sample-data';

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';
const THUMBNAIL_WIDTH = 230;

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
  const logoUrl = settings.logoUrl;

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
        <p className="text-sm text-muted-foreground">Pick the layout invoices are printed and downloaded with. Previews use sample data and your logo.</p>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" icon={Printer} iconPlacement="left" onClick={() => window.print()}>
            Print preview
          </Button>
          <Button size="sm" icon={Save} iconPlacement="left" loading={saving} onClick={save} disabled={selectedKey === savedKey || saving}>
            {saving ? 'Saving…' : 'Set as default'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        {INVOICE_TEMPLATE_META.map((meta) => {
          const Template = COMPONENTS[meta.key];
          const isSelected = meta.key === selectedKey;
          const isDefault = meta.key === savedKey;
          const scale = THUMBNAIL_WIDTH / meta.width;

          return (
            <button
              key={meta.key}
              type="button"
              onClick={() => setSelectedKey(meta.key)}
              aria-pressed={isSelected}
              className={cn(
                'group overflow-hidden rounded-xl border text-left shadow-sm transition hover:shadow-md',
                isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border/70 hover:border-primary/50'
              )}
            >
              <div className="pointer-events-none relative flex h-60 justify-center overflow-hidden border-b border-border/70 bg-muted/60 pt-3">
                <div className="h-full overflow-hidden" style={{ width: THUMBNAIL_WIDTH }}>
                  <div style={{ width: meta.width, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    <Template invoice={SAMPLE_INVOICE} logoUrl={logoUrl} />
                  </div>
                </div>
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className="bg-card p-4">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{meta.name}</p>
                  {isDefault && (
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <section className={cn(SURFACE, 'overflow-hidden print:border-0 print:shadow-none')}>
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 sm:px-5 print:hidden">
          <h2 className="text-sm font-semibold">{selected.name} preview</h2>
          <span className="text-xs text-muted-foreground">Sample order data</span>
        </div>
        <div className="overflow-x-auto bg-muted/60 p-6 print:bg-white print:p-0">
          <div id="invoice-print-area" className="flex justify-center">
            <SelectedTemplate invoice={SAMPLE_INVOICE} logoUrl={logoUrl} />
          </div>
        </div>
      </section>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
