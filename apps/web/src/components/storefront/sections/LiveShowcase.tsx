'use client';

import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ArrowRight, Boxes, Check, History, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

/**
 * The "how it works" panel: a looping product demo built from markup rather than a video file,
 * so it stays sharp at any width, weighs nothing, and is read by a screen reader as the text it
 * actually is. The frames are staged, but the SKUs and prices inside come from the live
 * catalogue, so the demo always shows the store's own stock.
 */

const SCENE_MS = 4600;

const SCENES = [
  {
    key: 'order',
    icon: ReceiptText,
    label: 'An order comes in',
    body: 'A sale is billed and the invoice is raised with every line, tax and total already worked out.',
  },
  {
    key: 'stock',
    icon: Boxes,
    label: 'Stock answers for itself',
    body: 'The shelf count drops the moment the order is placed, and flags itself before it runs out.',
  },
  {
    key: 'price',
    icon: History,
    label: 'Prices keep their history',
    body: 'Change a price and the old one is kept, dated and still attached to the orders it priced.',
  },
] as const;

export default function LiveShowcase() {
  const { data } = useGetAllPublicProductVariants({ page: 1, recordPerPage: 3, sortBy: 'createdAt', sortDirection: 'DESC' });
  const variants = useMemo(() => data?.data?.data?.data ?? [], [data]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Someone who asked for less motion gets the frames to step through by hand, not a carousel
  // that changes under them.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % SCENES.length), SCENE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const rows = useMemo(
    () =>
      (variants.length > 0
        ? variants
        : [
            { id: -1, sku: 'SKU-001', name: 'Sample product', sellingPrice: 1299, offerPrice: null, isOffer: false, product: { name: 'Sample product' } },
            { id: -2, sku: 'SKU-002', name: 'Sample product', sellingPrice: 2499, offerPrice: null, isOffer: false, product: { name: 'Sample product' } },
            { id: -3, sku: 'SKU-003', name: 'Sample product', sellingPrice: 899, offerPrice: null, isOffer: false, product: { name: 'Sample product' } },
          ]
      ).map((variant: Record<string, any>, index: number) => ({
        id: variant.id ?? index,
        sku: variant.sku ?? `SKU-00${index + 1}`,
        name: variant.product?.name ?? variant.name ?? 'Product',
        price: Number(variant.isOffer && variant.offerPrice != null ? variant.offerPrice : (variant.sellingPrice ?? 0)),
      })),
    [variants]
  );

  const scene = SCENES[active];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto mb-9 max-w-xl text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">How the store runs</span>
        <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">One order, three things handled</h2>
        <p className="mt-2 text-sm text-muted-foreground">Billing, stock and pricing stay in step on their own. Here is the same order moving through all three.</p>
      </div>

      <div
        className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <ol className="flex flex-col gap-2.5">
          {SCENES.map((item, index) => {
            const current = index === active;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200',
                    current ? 'border-primary/40 bg-primary/[0.04] shadow-sm' : 'border-border/70 bg-card hover:border-primary/25 hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors', current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className={cn('text-sm font-bold', current ? 'text-foreground' : 'text-foreground/80')}>{item.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </div>

                  {/* The bar doubles as the timer: it is the only cue that the panel will move on. */}
                  {current && !reducedMotion && (
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/15">
                      <span key={`${active}-${String(paused)}`} className={cn('block h-full bg-primary', paused ? 'w-0' : 'animate-[showcase-progress_4.6s_linear_forwards]')} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}

          <Link
            href="/products"
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse the catalogue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </ol>

        {/* The window chrome is decorative: the panel is a picture of the admin, not a live one. */}
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-4 py-2.5">
            <span aria-hidden className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </span>
            <span className="ml-2 truncate rounded-full bg-background px-3 py-1 font-mono text-[11px] text-muted-foreground">stocklivo · {scene.key}</span>
            <span className="ml-auto hidden items-center gap-1.5 text-[11px] font-semibold text-emerald-600 sm:flex dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                {!reducedMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>

          <div key={scene.key} className="min-h-[19rem] p-4 duration-500 animate-in fade-in slide-in-from-bottom-2 sm:p-5">
            {scene.key === 'order' && <OrderScene rows={rows} />}
            {scene.key === 'stock' && <StockScene rows={rows} />}
            {scene.key === 'price' && <PriceScene rows={rows} />}
          </div>
        </div>
      </div>
    </section>
  );
}

type Row = { id: number; sku: string; name: string; price: number };

const LABEL = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';

function OrderScene({ rows }: { rows: Row[] }) {
  const subtotal = rows.reduce((sum, row) => sum + row.price, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={LABEL}>Invoice</p>
          <p className="font-mono text-sm font-bold">ORD-20261012-0007</p>
        </div>
        <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-400">Confirmed</span>
      </div>

      <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
        {rows.map((row, index) => (
          <li
            key={row.id}
            style={{ animationDelay: `${index * 140}ms` }}
            className="flex items-center justify-between gap-3 px-3 py-2.5 duration-500 animate-in fade-in slide-in-from-left-3 fill-mode-both"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{row.name}</p>
              <code className="font-mono text-[10px] text-muted-foreground">{row.sku}</code>
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums">{formatPrice(row.price)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground">
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">Total billed</span>
        <span className="text-lg font-extrabold tabular-nums">{formatPrice(subtotal)}</span>
      </div>
    </div>
  );
}

function StockScene({ rows }: { rows: Row[] }) {
  // Staged figures: enough to show a count falling and one line tripping its low-stock flag.
  const levels = [
    { before: 24, after: 23, low: false },
    { before: 6, after: 5, low: true },
    { before: 41, after: 40, low: false },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={LABEL}>Stock on hand</p>
          <p className="text-sm font-bold">Adjusted by that order</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">−3 units</span>
      </div>

      <ul className="space-y-2">
        {rows.map((row, index) => {
          const level = levels[index % levels.length];
          return (
            <li
              key={row.id}
              style={{ animationDelay: `${index * 140}ms` }}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5 duration-500 animate-in fade-in slide-in-from-left-3 fill-mode-both"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{row.name}</p>
                <code className="font-mono text-[10px] text-muted-foreground">{row.sku}</code>
              </div>
              <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
                <span className="text-muted-foreground line-through">{level.before}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
                <span className={cn('font-bold', level.low ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>{level.after}</span>
                {level.low && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">Low</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PriceScene({ rows }: { rows: Row[] }) {
  const row = rows[0];
  const next = Math.round(row.price * 0.92);

  return (
    <div className="space-y-3">
      <div className="min-w-0">
        <p className={LABEL}>Price history</p>
        <p className="truncate text-sm font-bold">{row.name}</p>
      </div>

      <div className="flex items-end justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">New price</p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-extrabold tabular-nums">{formatPrice(next)}</span>
            <span className="text-xs tabular-nums text-muted-foreground line-through">{formatPrice(row.price)}</span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
          <Check className="h-3 w-3" strokeWidth={3} />
          Live now
        </span>
      </div>

      <ul className="space-y-1.5">
        {[
          { price: row.price, from: '06 Oct', to: '12 Oct', state: 'Ended' },
          { price: Math.round(row.price * 1.08), from: '21 Sep', to: '06 Oct', state: 'Ended' },
        ].map((entry, index) => (
          <li
            key={entry.from}
            style={{ animationDelay: `${(index + 1) * 140}ms` }}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 duration-500 animate-in fade-in slide-in-from-left-3 fill-mode-both"
          >
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{formatPrice(entry.price)}</span>
            <span className="flex items-center gap-2 text-[11px] tabular-nums text-muted-foreground">
              {entry.from} → {entry.to}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{entry.state}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-muted-foreground">Nothing is overwritten — the old price stays attached to the orders it priced.</p>
    </div>
  );
}
