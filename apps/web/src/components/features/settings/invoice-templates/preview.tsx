'use client';

import { Button } from '@/components/ui/button';
import { useGetSettings } from '@/hooks/service-hooks/useSettingService';
import { cn } from '@/lib/utils';
import { DEFAULT_INVOICE_TEMPLATE, INVOICE_TEMPLATE_META, InvoiceTemplateKey } from '@pms/types';
import { ArrowLeft, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import ClassicTemplate from './classic';
import MinimalTemplate from './minimal';
import ModernTemplate from './modern';
import { a3PrintScale, InvoiceA3PrintStyle } from './print-style';
import ReceiptTemplate from './receipt';
import { InvoiceTemplateProps, SAMPLE_INVOICE } from './sample-data';
import TaxTemplate from './tax';

const COMPONENTS: Record<InvoiceTemplateKey, React.ComponentType<InvoiceTemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  receipt: ReceiptTemplate,
  tax: TaxTemplate,
};

const ZOOM_STEPS = [0.5, 0.65, 0.8, 1, 1.25, 1.5];

const isTemplateKey = (value: string | null): value is InvoiceTemplateKey => INVOICE_TEMPLATE_META.some((meta) => meta.key === value);

export default function InvoiceTemplatePreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading } = useGetSettings();
  const settings = data?.data?.data ?? null;

  const requested = searchParams.get('template');
  const savedDefault = isTemplateKey(settings?.invoiceTemplate ?? null) ? (settings!.invoiceTemplate as InvoiceTemplateKey) : DEFAULT_INVOICE_TEMPLATE;
  const selectedKey = isTemplateKey(requested) ? requested : savedDefault;
  const [zoom, setZoom] = useState(1);

  const selected = INVOICE_TEMPLATE_META.find((meta) => meta.key === selectedKey) ?? INVOICE_TEMPLATE_META[0];
  const SelectedTemplate = COMPONENTS[selected.key];

  const selectTemplate = (key: InvoiceTemplateKey) => {
    router.replace(`/admin/invoice-templates/preview?template=${key}`, { scroll: false });
  };

  const zoomBy = (direction: 1 | -1) => {
    const index = ZOOM_STEPS.indexOf(zoom);
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, (index === -1 ? 3 : index) + direction))];
    setZoom(next);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm print:hidden">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/admin/settings">
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/60 p-1">
          {INVOICE_TEMPLATE_META.map((meta) => (
            <button
              key={meta.key}
              type="button"
              onClick={() => selectTemplate(meta.key)}
              aria-pressed={meta.key === selectedKey}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition',
                meta.key === selectedKey ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {meta.name}
              {meta.key === savedDefault && <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">Default</span>}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border/70 px-1 py-0.5">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomBy(-1)} disabled={zoom === ZOOM_STEPS[0]} title="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => zoomBy(1)}
              disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button size="sm" icon={Printer} iconPlacement="left" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-border/70 bg-muted/60 p-6 shadow-inner print:border-0 print:bg-white print:p-0 print:shadow-none">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Loading preview…</div>
        ) : (
          <div id="invoice-print-area" className="flex justify-center" style={{ zoom }}>
            <div id="invoice-print-sheet" className="shadow-lg">
              <SelectedTemplate invoice={SAMPLE_INVOICE} logoUrl={settings?.logoUrl} />
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Previews use sample order data and your uploaded logo. Printing produces one A3 portrait sheet.
      </p>

      <InvoiceA3PrintStyle scale={a3PrintScale(selected)} />
    </div>
  );
}
