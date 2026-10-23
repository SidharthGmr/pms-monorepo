'use client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useId, useState } from 'react';
import { DayBucket } from './daily-buckets';
import { smoothPath } from './sparkline';

/**
 * Sales and invoices for the same run of days in the price-and-volume shape: the rupee series
 * as a smoothed area with gridlines on top, the invoice counts as a bar strip underneath. Two
 * plots rather than one with two y-axes - rupees and a count share no scale - but one cursor:
 * hovering anywhere reads the whole day out in the header, which always shows a date and both
 * figures (the latest day at rest).
 */

interface DayColumnsProps {
  buckets: DayBucket[];
  formatMoney: (value: number, compact?: boolean) => string;
  className?: string;
}

const AREA_HEIGHT = 108;
const BAR_HEIGHT = 34;
const PAD = 6;
const GRID_LINES = [0.25, 0.5, 0.75];

export default function DayColumns({ buckets, formatMoney, className }: DayColumnsProps) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  if (buckets.length < 2) return <p className={cn('text-xs text-muted-foreground', className)}>No orders in this period yet.</p>;

  const maxSales = Math.max(1, ...buckets.map((bucket) => bucket.sales));
  const maxOrders = Math.max(1, ...buckets.map((bucket) => bucket.orders));
  const shown = active ?? buckets.length - 1;
  const plot = 100 - PAD * 2;

  const coords = buckets.map((bucket, index) => ({
    x: (index / (buckets.length - 1)) * 100,
    y: PAD + (1 - bucket.sales / maxSales) * plot,
  }));
  const line = smoothPath(coords, PAD);
  const area = `${line} L100,100 L0,100 Z`;

  const track = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
    setActive(Math.min(buckets.length - 1, Math.max(0, Math.round(ratio * (buckets.length - 1)))));
  };

  // Four date ticks are enough to anchor a fortnight; one per bar collides below ~500px.
  const tickIndexes = [0, Math.round((buckets.length - 1) / 3), Math.round(((buckets.length - 1) * 2) / 3), buckets.length - 1];

  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-semibold tabular-nums">
          {format(buckets[shown].date, 'EEE, d MMM')}
          {active === null && <span className="ml-1 text-[10px] font-normal text-muted-foreground">· latest</span>}
        </span>
        <span className="flex items-center gap-3 text-[11px] tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <strong className="font-bold text-foreground">{formatMoney(buckets[shown].sales)}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden />
            {buckets[shown].orders} {buckets[shown].orders === 1 ? 'invoice' : 'invoices'}
          </span>
        </span>
      </div>

      <div onMouseMove={track} onMouseLeave={() => setActive(null)}>
        {/* Sales: the money is the headline series, so it gets the tall plot and the gridlines. */}
        <div className="relative" style={{ height: AREA_HEIGHT }}>
          <svg width="100%" height={AREA_HEIGHT} viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            {GRID_LINES.map((ratio) => (
              <line key={ratio} x1="0" y1={PAD + plot * ratio} x2="100" y2={PAD + plot * ratio} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            ))}
            <line x1="0" y1="100" x2="100" y2="100" stroke="hsl(var(--border))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d={area} fill={`url(#${gradientId})`} />
            <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {active !== null && (
              <line x1={coords[shown].x} y1={PAD} x2={coords[shown].x} y2="100" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" vectorEffect="non-scaling-stroke" />
            )}
            <circle cx={coords[shown].x} cy={coords[shown].y} r="4" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* The scale in two anchors, kept off the plot so the curve owns the space. */}
          <span className="pointer-events-none absolute right-0 top-0 text-[9px] tabular-nums text-muted-foreground">{formatMoney(maxSales, true)}</span>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground/70">{formatMoney(maxSales / 2, true)}</span>
        </div>

        {/* Invoices: the volume strip under the price, sharing the same x slots. */}
        <div className="mt-2 flex items-end gap-[3px]" style={{ height: BAR_HEIGHT }} aria-label="Invoices per day">
          {buckets.map((bucket, index) => (
            <div key={bucket.date.toISOString()} className="flex h-full flex-1 items-end">
              <div
                className={cn('w-full rounded-[3px] bg-secondary transition-[height,opacity] duration-300', active !== null && shown !== index && 'opacity-30')}
                style={{ height: bucket.orders > 0 ? `${Math.max((bucket.orders / maxOrders) * 100, 10)}%` : '2px' }}
                title={`${format(bucket.date, 'd MMM')}: ${bucket.orders} ${bucket.orders === 1 ? 'invoice' : 'invoices'}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-1.5 h-3 text-[9px] tabular-nums text-muted-foreground">
        {tickIndexes.map((index) => (
          <span
            key={index}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${(index / (buckets.length - 1)) * 100}%`, transform: index === 0 ? 'none' : index === buckets.length - 1 ? 'translateX(-100%)' : undefined }}
          >
            {format(buckets[index].date, 'd MMM')}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-4 border-t pt-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-primary" aria-hidden />
          Sales (₹)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-secondary" aria-hidden />
          Invoices
        </span>
      </div>
    </div>
  );
}
