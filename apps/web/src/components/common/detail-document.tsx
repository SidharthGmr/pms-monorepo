'use client';

import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { Check, FileText, Info, Mail, MapPin, Package, Phone } from 'lucide-react';
import Link from 'next/link';
import React, { ReactNode } from 'react';

export const DETAIL_SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';
export const DETAIL_LABEL = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';

interface DetailDocumentHeaderProps {
  icon: ReactNode;
  kicker: string;
  title: string;
  meta?: string;
  amountLabel: string;
  amount: string;
  amountMeta?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  extra?: ReactNode;
  variant?: 'subtle' | 'brand';
}

export function DetailDocumentHeader({
  icon,
  kicker,
  title,
  meta,
  amountLabel,
  amount,
  amountMeta,
  actions,
  badge,
  extra,
  variant = 'subtle',
}: DetailDocumentHeaderProps) {
  if (variant === 'brand') {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-md">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/[0.06]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-28 h-64 w-64 rounded-full bg-white/[0.05]" />
        {badge && <div className="absolute right-4 top-4 z-10">{badge}</div>}

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">{icon}</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">{kicker}</p>
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {meta && <p className="mt-1 text-xs text-primary-foreground/80">{meta}</p>}
              {extra && <div className="mt-2.5">{extra}</div>}
            </div>
          </div>

          <div aria-hidden className="hidden h-16 w-px shrink-0 bg-white/20 sm:block" />

          <div className="min-w-0 shrink-0 sm:pr-2">
            <p className="text-[11px] font-semibold text-primary-foreground/70">{amountLabel}</p>
            <p className="text-3xl font-bold tabular-nums leading-tight">{amount}</p>
            {amountMeta && <p className="mt-1 text-xs text-primary-foreground/75">{amountMeta}</p>}
          </div>
        </div>

        {actions && <div className="relative flex flex-wrap items-center gap-2 border-t border-white/15 px-5 py-2.5">{actions}</div>}
      </div>
    );
  }

  return (
    <div className="border-b border-border/70 bg-gradient-to-r from-primary/[0.07] via-primary/[0.03] to-transparent">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">{icon}</span>
          <div className="min-w-0">
            <p className={DETAIL_LABEL}>{kicker}</p>
            <h1 className="truncate font-mono text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            {meta && <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>}
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className={DETAIL_LABEL}>{amountLabel}</p>
          <p className="text-2xl font-bold tabular-nums leading-tight text-primary">{amount}</p>
          {amountMeta && <p className="text-[11px] text-muted-foreground">{amountMeta}</p>}
        </div>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2 border-t border-border/50 px-4 py-2.5 sm:px-5">{actions}</div>}
    </div>
  );
}

export interface DetailTimelineStep {
  key: string;
  label: string;
  hint: string;
  icon: ReactNode;
}

interface DetailStatusPanelProps {
  title?: string;
  tone: string;
  icon: ReactNode;
  label: string;
  hint: string;
  steps?: DetailTimelineStep[];
  activeKey?: string;
  showTimeline?: boolean;
}

export function DetailStatusPanel({ title, tone, icon, label, hint, steps, activeKey, showTimeline = true }: DetailStatusPanelProps) {
  const stepIndex = steps && activeKey ? steps.findIndex((step) => step.key === activeKey) : -1;

  return (
    <section className={cn(DETAIL_SURFACE, 'p-4 sm:p-5')}>
      {title && <h2 className="mb-3 text-base font-bold tracking-tight">{title}</h2>}

      <div className={cn('flex items-center gap-3 rounded-lg px-3.5 py-3 ring-1 ring-inset ring-border/50', tone)}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-sm">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">{label}</p>
          <p className="mt-0.5 text-[11px] leading-snug opacity-80">{hint}</p>
        </div>
        <span aria-hidden className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      </div>

      {showTimeline && steps && steps.length > 0 && (
        <ol className="mt-4 pl-1">
          {steps.map((step, idx) => {
            const done = idx < stepIndex;
            const active = idx === stepIndex;
            const last = idx === steps.length - 1;

            return (
              <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                {!last && (
                  <span
                    aria-hidden
                    className={cn('absolute left-[15px] top-9 h-[calc(100%-28px)] w-0.5 rounded', done ? 'bg-primary' : 'bg-border')}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    done
                      ? 'bg-primary text-primary-foreground'
                      : active
                        ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.icon}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p
                    className={cn(
                      'text-sm font-semibold leading-tight',
                      active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{step.hint}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function DetailSectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
    </div>
  );
}

interface DetailPartyProps {
  /** Kicker above the block, e.g. "From" / "Quote for" / "Bill to". */
  label?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  /** Logo/photo for the tile; falls back to `icon`, then to the name's initials. */
  imageUrl?: string | null;
  icon?: ReactNode;
  /** Extra lines under the contact row (an address, a customer link, ...). */
  children?: ReactNode;
  className?: string;
}

export function DetailParty({ label, name, email, phone, imageUrl, icon, children, className }: DetailPartyProps) {
  return (
    <div className={cn('min-w-0', className)}>
      {label && <p className={DETAIL_LABEL}>{label}</p>}
      <div className={cn('flex items-start gap-3', label && 'mt-2.5')}>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-primary',
            imageUrl || icon ? 'border border-border/70 bg-primary/5' : 'bg-primary/10 text-xs font-bold uppercase'
          )}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            (icon ?? name.slice(0, 2))
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" title={name}>
            {name}
          </p>
          {(email || phone) && (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {email && (
                <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-1.5 truncate hover:text-foreground hover:underline">
                  <Mail className="h-3 w-3 shrink-0" />
                  {email}
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline">
                  <Phone className="h-3 w-3 shrink-0" />
                  {phone}
                </a>
              )}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function DetailAddress({ label, address, className }: { label: string; address?: string | null; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-foreground/85">{address || '—'}</p>
    </div>
  );
}

export interface DetailLineItem {
  id: number | string;
  name: string;
  /** Links the name (and image tile) to the product page. */
  href?: string;
  imageUrl?: string | null;
  /** The variant shown as a tinted chip under the name. */
  variantLabel?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount?: number | null;
  taxAmount?: number | null;
  /** Small line under the tax amount, e.g. "GST@18%". */
  taxLabel?: string | null;
  total: number;
  /** Rendered under the description, e.g. a review cell. */
  extra?: ReactNode;
}

interface DetailLineItemsProps {
  items: DetailLineItem[];
  emptyMessage: string;
  /** Both default on; a document without per-line discounts/taxes hides the column. */
  showDiscount?: boolean;
  showTax?: boolean;
}

export function DetailLineItems({ items, emptyMessage, showDiscount = true, showTax = true }: DetailLineItemsProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
        <Package className="h-8 w-8 text-muted-foreground/40" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border/70 bg-muted/40">
            <th className={cn(DETAIL_LABEL, 'w-10 px-3 py-2.5 sm:px-4')}>#</th>
            <th className={cn(DETAIL_LABEL, 'px-2 py-2.5')}>Description</th>
            <th className={cn(DETAIL_LABEL, 'w-24 px-2 py-2.5 text-right')}>Rate</th>
            <th className={cn(DETAIL_LABEL, 'w-14 px-2 py-2.5 text-center')}>Qty</th>
            {showDiscount && <th className={cn(DETAIL_LABEL, 'hidden w-24 px-2 py-2.5 text-center md:table-cell')}>Discount</th>}
            {showTax && <th className={cn(DETAIL_LABEL, 'hidden w-28 px-2 py-2.5 text-right md:table-cell')}>Tax</th>}
            <th className={cn(DETAIL_LABEL, 'w-28 px-4 py-2.5 text-right sm:px-5')}>Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {items.map((item, index) => (
            <tr key={item.id} className="align-top">
              <td className="px-3 py-3.5 text-xs tabular-nums text-muted-foreground sm:px-4">{index + 1}</td>
              <td className="px-2 py-3">
                <div className="flex items-start gap-3">
                  {item.imageUrl && (
                    <span className="hidden h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 sm:flex">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    </span>
                  )}
                  <div className="min-w-0">
                    {item.href ? (
                      <Link href={item.href} className="line-clamp-2 text-sm font-semibold hover:underline" title={item.name}>
                        {item.name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm font-semibold" title={item.name}>
                        {item.name}
                      </p>
                    )}
                    {(item.variantLabel || item.sku) && (
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {item.variantLabel && (
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-primary">
                            {item.variantLabel}
                          </span>
                        )}
                        {item.sku && <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{item.sku}</span>}
                      </p>
                    )}
                    {item.extra}
                  </div>
                </div>
              </td>
              <td className="px-2 py-3.5 text-right text-sm tabular-nums text-foreground/80">{formatPrice(item.unitPrice)}</td>
              <td className="px-2 py-3.5 text-center text-sm tabular-nums text-foreground/80">{item.quantity}</td>
              {showDiscount && (
                <td className="hidden px-2 py-3.5 text-center text-sm tabular-nums md:table-cell">
                  {item.discountAmount && item.discountAmount > 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400">−{formatPrice(item.discountAmount)}</span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
              )}
              {showTax && (
                <td className="hidden px-2 py-3.5 text-right md:table-cell">
                  {item.taxAmount && item.taxAmount > 0 ? (
                    <div className="text-sm tabular-nums text-foreground/80">
                      {formatPrice(item.taxAmount)}
                      {item.taxLabel && <p className="text-[10px] font-medium text-muted-foreground">{item.taxLabel}</p>}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">—</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums sm:px-5">{formatPrice(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailTotalsFooter({ words, note, children }: { words?: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 border-t border-border/70 bg-muted/30 p-4 sm:p-5 lg:grid-cols-2">
      <div className="min-w-0 space-y-3">
        {words && (
          <div className="rounded-lg border border-primary/15 bg-primary/5 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <FileText className="h-3.5 w-3.5" />
              Amount in Words
            </p>
            <p className="mt-1.5 text-sm font-medium italic leading-relaxed text-foreground/85">{words}</p>
          </div>
        )}
        {note && (
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {note}
          </p>
        )}
      </div>

      <dl className="space-y-1.5 text-sm">{children}</dl>
    </div>
  );
}

export function DetailTotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-2.5">
      <dt className="text-sm font-bold">{label}</dt>
      <dd className="rounded-lg bg-primary px-3.5 py-1.5 text-base font-bold tabular-nums text-primary-foreground">{value}</dd>
    </div>
  );
}

export function SummaryLine({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export function FactRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-border/70 py-2 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('min-w-0 break-words text-right text-xs font-medium', highlight && 'text-amber-600 dark:text-amber-400')}>{value}</dd>
    </div>
  );
}
