'use client';
import { Skeleton } from '@/components/ui/skeleton';


import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { cn } from '@/lib/utils';
import { format, isSameDay, startOfDay, subDays } from 'date-fns';
import { CalendarDays, LineChart, List } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatCount, formatMoney } from './format';
import { OrderDto, OrderStatusEnum } from '@pms/types';
// The Focus cut of the week's sales, in two readings of the same days. The list states every
// amount exactly and survives a phone; the curve shows which way the week is going. The choice
// is remembered per browser.
//
// The orders API has no date filter, so the newest orders are fetched and bucketed by day here.
// FETCH_LIMIT is comfortably above a week of orders for the stores this serves; if a store ever
// outgrows it the panel says so rather than silently under-counting.
const FETCH_LIMIT = 200;
const EXCLUDED: string[] = [OrderStatusEnum.Cancelled, OrderStatusEnum.Returned];
const STORAGE_KEY = 'dashboard.sales-trend.view';
const PAD_TOP = 16;

type SalesView = 'list' | 'chart';

const VIEWS: { value: SalesView; label: string; icon: typeof List }[] = [
  { value: 'list', label: 'Day by day', icon: List },
  { value: 'chart', label: 'Trend line', icon: LineChart },
];

interface DayBucket {
  date: Date;
  label: string;
  sales: number;
  orders: number;
}

export default function FocusSalesTrend({ days = 7 }: { days?: number }) {
  const { data, isLoading, isError } = useGetAllOrders({ page: 1, recordPerPage: FETCH_LIMIT });
  const orders = useMemo(() => (data?.data?.data?.data as OrderDto[] | undefined) ?? [], [data]);
  const [view, setView] = useState<SalesView>('chart');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'list' || stored === 'chart') setView(stored);
    } catch {
      return;
    }
  }, []);

  const changeView = (next: SalesView) => {
    setView(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    }
  };

  const { buckets, truncated } = useMemo(() => {
    const today = startOfDay(new Date());
    const list: DayBucket[] = Array.from({ length: days }, (_, i) => {
      const date = subDays(today, days - 1 - i);
      return { date, label: format(date, 'EEE d'), sales: 0, orders: 0 };
    });
    for (const order of orders) {
      if (EXCLUDED.includes(order.status)) continue;
      const at = new Date(order.createdAt);
      const bucket = list.find((b) => isSameDay(b.date, at));
      if (!bucket) continue;
      bucket.sales += order.grandTotal ?? 0;
      bucket.orders += 1;
    }
    const oldest = orders.length ? new Date(orders[orders.length - 1].createdAt) : null;
    const windowStart = list[0].date;
    return { buckets: list, truncated: orders.length >= FETCH_LIMIT && !!oldest && oldest > windowStart };
  }, [orders, days]);

  const totals = useMemo(() => {
    const sales = buckets.reduce((n, b) => n + b.sales, 0);
    const count = buckets.reduce((n, b) => n + b.orders, 0);
    const best = buckets.reduce<DayBucket | null>((acc, b) => (b.sales > (acc?.sales ?? 0) ? b : acc), null);
    return { sales, count, best, max: Math.max(1, ...buckets.map((b) => b.sales)) };
  }, [buckets]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: days }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <p className="py-6 text-center text-xs text-muted-foreground">Could not load recent orders.</p>;
  }

  return (
    <div className="space-y-4">
      {/* The three figures that describe the week, and the switch between the two readings. */}
      <div className="flex flex-wrap items-center gap-3">
        <dl className="grid min-w-0 flex-1 grid-cols-3 divide-x divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-muted/20">
          <div className="px-3 py-2.5">
            <dt className="text-[11px] text-muted-foreground">Sales, {days} days</dt>
            <dd className="truncate text-base font-bold tabular-nums leading-tight sm:text-lg">{formatMoney(totals.sales)}</dd>
          </div>
          <div className="px-3 py-2.5">
            <dt className="text-[11px] text-muted-foreground">Orders</dt>
            <dd className="truncate text-base font-bold tabular-nums leading-tight sm:text-lg">{formatCount(totals.count)}</dd>
          </div>
          <div className="px-3 py-2.5">
            <dt className="text-[11px] text-muted-foreground">Average a day</dt>
            <dd className="truncate text-base font-bold tabular-nums leading-tight sm:text-lg">{formatMoney(Math.round(totals.sales / days))}</dd>
          </div>
        </dl>

        <div className="inline-flex shrink-0 rounded-md border bg-muted/40 p-0.5" role="radiogroup" aria-label="Sales layout">
          {VIEWS.map(({ value, label, icon: Icon }) => {
            const isActive = value === view;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={label}
                title={label}
                onClick={() => changeView(value)}
                className={cn(
                  'inline-flex h-7 w-8 items-center justify-center rounded text-xs font-medium transition-colors',
                  isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {totals.count === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 py-8 text-center">
          <CalendarDays className="h-7 w-7 text-muted-foreground/40" />
          <p className="text-sm font-medium">No sales in the last {days} days</p>
          <p className="text-xs text-muted-foreground">Completed orders will be listed here day by day.</p>
        </div>
      ) : view === 'list' ? (
        <DayRows buckets={buckets} max={totals.max} best={totals.best} />
      ) : (
        <DayCurve buckets={buckets} max={totals.max} best={totals.best} days={days} total={totals.sales} />
      )}

      {truncated && <p className="text-[11px] text-muted-foreground">Only the latest {FETCH_LIMIT} orders were counted, so earlier days may be under-reported.</p>}
    </div>
  );
}

/** Newest day first, each with its exact figure; the bar is only there for proportion. */
function DayRows({ buckets, max, best }: { buckets: DayBucket[]; max: number; best: DayBucket | null }) {
  return (
    <ol className="space-y-0.5">
      {[...buckets].reverse().map((b) => {
        const isToday = isSameDay(b.date, new Date());
        const isBest = !!best && best.sales > 0 && isSameDay(best.date, b.date);
        const width = b.sales > 0 ? Math.max(3, (b.sales / max) * 100) : 0;
        return (
          <li
            key={b.date.toISOString()}
            title={`${format(b.date, 'EEEE d MMMM')}: ${formatMoney(b.sales)} from ${b.orders} ${b.orders === 1 ? 'order' : 'orders'}`}
            className={cn('group grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-1.5 sm:gap-3 sm:px-2', isToday && 'bg-primary/5')}
          >
            <span className={cn('truncate text-xs', isToday ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{isToday ? 'Today' : b.label}</span>

            <span className="flex h-2 min-w-0 overflow-hidden rounded-full bg-muted">
              <span
                className={cn('h-full rounded-full transition-[width] duration-500', isToday ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary/60')}
                style={{ width: `${width}%` }}
              />
            </span>

            <span className="flex items-baseline justify-end gap-2">
              {isBest && (
                <span className="hidden rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 sm:inline dark:text-emerald-400">Best</span>
              )}
              <span className={cn('w-[5.5rem] text-right text-sm tabular-nums', b.sales > 0 ? 'font-semibold' : 'text-muted-foreground')}>{b.sales > 0 ? formatMoney(b.sales) : '—'}</span>
              <span className="w-9 text-right text-[11px] tabular-nums text-muted-foreground">{b.orders > 0 ? formatCount(b.orders) : ''}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The same days as a curve, with the figures under the pointer rather than over every column. */
function DayCurve({ buckets, max, best, days, total }: { buckets: DayBucket[]; max: number; best: DayBucket | null; days: number; total: number }) {
  const [active, setActive] = useState<number | null>(null);

  const points = useMemo(
    () =>
      buckets.map((b, i) => ({
        x: ((i + 0.5) / buckets.length) * 100,
        y: PAD_TOP + (1 - b.sales / max) * (100 - PAD_TOP),
      })),
    [buckets, max]
  );

  return (
    <div>
      <div className="relative h-44" role="img" aria-label={`Daily sales for the last ${days} days, ${formatMoney(total)} in total`}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden focusable="false">
          <defs>
            <linearGradient id="focus-sales-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[PAD_TOP, PAD_TOP + (100 - PAD_TOP) / 2, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity={y === 100 ? 1 : 0.7} />
          ))}
          <path d={`${curve(points)} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`} fill="url(#focus-sales-fill)" />
          <path d={curve(points)} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* The dots and hit areas live in HTML: the SVG is stretched non-uniformly, which would
            squash circles into ovals. */}
        <div className="absolute inset-0 flex" onMouseLeave={() => setActive(null)}>
          {buckets.map((b, i) => {
            const isToday = isSameDay(b.date, new Date());
            const isActive = active === i;
            return (
              <button
                key={b.date.toISOString()}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${format(b.date, 'EEE d MMM')}: ${formatMoney(b.sales)} from ${b.orders} ${b.orders === 1 ? 'order' : 'orders'}`}
                className={cn('relative min-w-0 flex-1 rounded-lg outline-none transition-colors hover:bg-primary/5 focus-visible:bg-primary/10', isActive && 'bg-primary/5')}
              >
                <span
                  className={cn(
                    'absolute left-1/2 block -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-background transition-all',
                    isToday || isActive ? 'h-3 w-3 bg-primary shadow-sm' : 'h-2 w-2 bg-primary/55'
                  )}
                  style={{ bottom: `${100 - points[i].y}%` }}
                />
                {isActive && (
                  <span
                    className={cn(
                      'pointer-events-none absolute z-10 mb-3 w-max rounded-lg border border-border bg-popover px-2.5 py-1.5 text-left shadow-md',
                      i === 0 ? 'left-0' : i === buckets.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                    )}
                    style={{ bottom: `${100 - points[i].y}%` }}
                  >
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{format(b.date, 'EEE d MMM')}</span>
                    <span className="block text-sm font-bold tabular-nums leading-tight">{formatMoney(b.sales)}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {formatCount(b.orders)} {b.orders === 1 ? 'order' : 'orders'}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex">
        {buckets.map((b, i) => {
          const isToday = isSameDay(b.date, new Date());
          return (
            <span
              key={b.date.toISOString()}
              className={cn('min-w-0 flex-1 truncate text-center text-[11px] tabular-nums transition-colors', isToday || active === i ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            >
              {isToday ? 'Today' : format(b.date, 'EEE')}
            </span>
          );
        })}
      </div>

      {best && best.sales > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Best day was <span className="font-medium text-foreground">{format(best.date, 'EEE d MMM')}</span> at {formatMoney(best.sales)}.
        </p>
      )}
    </div>
  );
}

/**
 * A Catmull-Rom curve through the points, with the control points clamped to each segment's own
 * range so a quiet day between two busy ones cannot bow the line below zero.
 */
function curve(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const clamp = (value: number, a: number, b: number) => Math.min(Math.max(value, Math.min(a, b)), Math.max(a, b));
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: clamp(p1.y + (p2.y - p0.y) / 6, p1.y, p2.y) };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: clamp(p2.y - (p3.y - p1.y) / 6, p1.y, p2.y) };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }

  return d;
}
