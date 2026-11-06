import {
  DETAIL_LABEL as LABEL,
  DETAIL_SURFACE as SURFACE,
  DetailAddress,
  DetailLineItems,
  DetailTotalRow,
  DetailTotalsFooter,
  SummaryLine as Line,
} from '@/components/common/detail-document';
import { amountInWords } from '@/lib/amount-in-words';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { PublicDocumentDto } from '@pms/types';
import { format } from 'date-fns';
import { CalendarClock, Mail, MapPin, Phone, Store } from 'lucide-react';

/**
 * What the recipient of a share link sees. No app chrome, no auth, no actions - the document
 * exactly as it stands, printable, on any device. It is handed a PublicDocumentDto, so an
 * estimate and an order render through the same layout.
 */

const TONE: Record<string, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
  SENT: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  ACCEPTED: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-700 ring-rose-500/20',
  EXPIRED: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
  CONVERTED: 'bg-violet-500/10 text-violet-700 ring-violet-500/20',
  CANCELLED: 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20',
  PENDING: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
  CONFIRMED: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  RETURNED: 'bg-orange-500/10 text-orange-700 ring-orange-500/20',
};

const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export default function PublicDocumentView({ document }: { document: PublicDocumentDto }) {
  const isEstimate = document.kind === 'ESTIMATE';
  const heading = isEstimate ? 'Estimate / Quotation' : 'Invoice';
  const amountLabel = isEstimate ? 'Quoted amount' : 'Amount payable';
  const totals = document.totals;
  const validUntil = document.validUntil ? new Date(document.validUntil) : null;
  const hasGstSplit = totals.cgstAmount > 0 || totals.sgstAmount > 0 || totals.igstAmount > 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <section className={cn(SURFACE, 'overflow-hidden')}>
        <div className="flex flex-col gap-5 border-b border-border/70 bg-gradient-to-br from-primary via-primary to-primary/80 p-5 text-primary-foreground sm:flex-row sm:items-center sm:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15">
              {document.store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={document.store.logoUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <Store className="h-6 w-6" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">{heading}</p>
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{document.number}</h1>
              <p className="mt-1 text-xs text-primary-foreground/80">
                {format(new Date(document.issuedAt), 'd MMM yyyy')}
                {document.referenceNumber ? ` · Ref ${document.referenceNumber}` : ''}
              </p>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-[11px] font-semibold text-primary-foreground/70">{amountLabel}</p>
            <p className="text-3xl font-bold tabular-nums leading-tight">{formatPrice(totals.grandTotal)}</p>
            <span
              className={cn(
                'mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                TONE[document.status] ?? 'bg-background text-muted-foreground ring-border'
              )}
            >
              {titleCase(document.status)}
            </span>
          </div>
        </div>

        {isEstimate && validUntil && (
          <div
            className={cn(
              'flex items-center gap-2 border-b border-border/70 px-4 py-2.5 text-xs font-medium sm:px-5',
              document.isExpired ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300' : 'bg-muted/40 text-muted-foreground'
            )}
          >
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            {document.isExpired
              ? `This quotation expired on ${format(validUntil, 'd MMM yyyy')}. Contact us for an updated price.`
              : `Valid until ${format(validUntil, 'd MMM yyyy')}`}
          </div>
        )}

        <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-4 sm:px-5">
            <p className={LABEL}>From</p>
            <p className="mt-2 text-sm font-bold">{document.store.name}</p>
            {document.store.address && <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{document.store.address}</p>}
            {(document.store.email || document.store.phone) && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {document.store.email && (
                  <a href={`mailto:${document.store.email}`} className="inline-flex min-w-0 items-center gap-1.5 truncate hover:text-foreground hover:underline">
                    <Mail className="h-3 w-3 shrink-0" />
                    {document.store.email}
                  </a>
                )}
                {document.store.phone && (
                  <a href={`tel:${document.store.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline">
                    <Phone className="h-3 w-3 shrink-0" />
                    {document.store.phone}
                  </a>
                )}
              </p>
            )}
          </div>

          <div className="px-4 py-4 sm:px-5">
            <p className={LABEL}>{isEstimate ? 'Quote for' : 'Billed to'}</p>
            <p className="mt-2 text-sm font-bold">{document.customerName}</p>
            {!document.billingAddress && !document.shippingAddress && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                No address on file
              </p>
            )}
          </div>
        </div>

        {(document.billingAddress || document.shippingAddress) && (
          <div className="grid grid-cols-1 divide-y divide-border/70 border-t border-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <DetailAddress label="Billing address" address={document.billingAddress} className="px-4 py-3.5 sm:px-5" />
            <DetailAddress label="Shipping address" address={document.shippingAddress} className="px-4 py-3.5 sm:px-5" />
          </div>
        )}

        <div className="border-t border-border/70">
          <DetailLineItems
            emptyMessage="No items are recorded on this document."
            showDiscount={document.items.some((item) => item.discountAmount > 0)}
            showTax={document.items.some((item) => item.taxAmount > 0)}
            items={document.items.map((item, index) => ({
              id: `${item.sku ?? item.name}-${index}`,
              name: item.name,
              variantLabel: item.variantName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountAmount: item.discountAmount,
              taxAmount: item.taxAmount,
              taxLabel: item.taxLabel,
              total: item.lineTotal,
            }))}
          />
        </div>

        <DetailTotalsFooter
          words={amountInWords(totals.grandTotal)}
          note={isEstimate ? 'This is a quotation, not a bill — no payment is due yet.' : undefined}
        >
          <Line label="Subtotal" value={formatPrice(totals.subtotal)} />
          {totals.itemDiscountTotal > 0 && (
            <Line label="Item discounts" value={`−${formatPrice(totals.itemDiscountTotal)}`} className="text-emerald-700 dark:text-emerald-400" />
          )}
          {totals.additionalDiscount > 0 && (
            <Line label="Discount" value={`−${formatPrice(totals.additionalDiscount)}`} className="text-emerald-700 dark:text-emerald-400" />
          )}
          {totals.taxAmount > 0 && (
            <>
              <Line label="Taxable amount" value={formatPrice(totals.taxableAmount)} className="text-muted-foreground" />
              {hasGstSplit &&
                (totals.igstAmount > 0 ? (
                  <Line label="IGST" value={formatPrice(totals.igstAmount)} className="text-muted-foreground" />
                ) : (
                  <>
                    <Line label="CGST" value={formatPrice(totals.cgstAmount)} className="text-muted-foreground" />
                    <Line label="SGST" value={formatPrice(totals.sgstAmount)} className="text-muted-foreground" />
                  </>
                ))}
              <Line label="Total tax (incl. in prices)" value={formatPrice(totals.taxAmount)} className="text-muted-foreground" />
            </>
          )}
          {totals.shippingCharges > 0 && <Line label="Shipping" value={formatPrice(totals.shippingCharges)} />}
          {totals.adjustment !== 0 && <Line label="Adjustment" value={formatPrice(totals.adjustment)} />}
          <DetailTotalRow label={isEstimate ? 'Estimate Total' : 'Grand Total'} value={formatPrice(totals.grandTotal)} />
        </DetailTotalsFooter>

        {(document.notes || document.terms) && (
          <div className="grid grid-cols-1 gap-4 border-t border-border/70 p-4 sm:p-5 lg:grid-cols-2">
            {document.notes && (
              <div className="min-w-0">
                <p className={LABEL}>Notes</p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{document.notes}</p>
              </div>
            )}
            {document.terms && (
              <div className="min-w-0">
                <p className={LABEL}>Terms &amp; conditions</p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{document.terms}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Questions about this {isEstimate ? 'quotation' : 'invoice'}? Reply to the email you received, or contact {document.store.name}.
      </p>
    </main>
  );
}
