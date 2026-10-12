'use client';
import { Skeleton } from '@/components/ui/skeleton';
import { toneFor } from '@/components/features/orders/order-status';
import { OrderDto } from '@/dtos/order.dto';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { useGetAllPurchases } from '@/hooks/service-hooks/usePurchaseService';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { Activity, ChevronRight, ShoppingBag, Truck } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { formatMoney } from './format';

// The Focus cut of the feed. The shared ActivityFeed is one undifferentiated stream; this one
// reads as a day book - each day opens with what it took and what it spent, so the rows beneath
// are a breakdown rather than a list. Money in and money out keep opposite sides of the row.
type Kind = 'order' | 'purchase';
type Filter = 'all' | Kind;

interface FeedItem {
  key: string;
  kind: Kind;
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  at: Date;
  href: string;
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'order', label: 'Sales' },
  { value: 'purchase', label: 'Stock' },
];

const dayLabel = (d: Date) => (isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEE d MMM'));

export default function FocusActivityFeed({ limit = 6 }: { limit?: number }) {
  const orders = useGetAllOrders({ page: 1, recordPerPage: limit });
  const purchases = useGetAllPurchases({ page: 1, recordPerPage: limit });
  const [filter, setFilter] = useState<Filter>('all');

  const all = useMemo<FeedItem[]>(() => {
    const orderItems: FeedItem[] = ((orders.data?.data?.data?.data as OrderDto[] | undefined) ?? []).map((o) => ({
      key: `o-${o.id}`,
      kind: 'order',
      title: o.orderNumber,
      subtitle: o.customer ? `${o.customer.firstName ?? ''} ${o.customer.lastName ?? ''}`.trim() || 'Walk-in' : o.createdByName || 'Walk-in',
      amount: o.grandTotal ?? 0,
      status: String(o.status ?? ''),
      at: new Date(o.createdAt),
      href: `/admin/orders/${o.id}`,
    }));
    const purchaseItems: FeedItem[] = ((purchases.data?.data?.data?.data as PurchaseDto[] | undefined) ?? []).map((p) => ({
      key: `p-${p.id}`,
      kind: 'purchase',
      title: p.invoiceNumber || `Purchase #${p.id}`,
      subtitle: p.supplierName || 'Supplier',
      amount: p.totalAmount ?? 0,
      status: String(p.status ?? ''),
      at: new Date(p.purchaseDate || p.createdAt),
      href: `/admin/stock-purchase/history/${p.id}`,
    }));
    return [...orderItems, ...purchaseItems].sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [orders.data, purchases.data]);

  const items = useMemo(() => all.filter((item) => filter === 'all' || item.kind === filter).slice(0, limit), [all, filter, limit]);

  // Each day opens with its own takings and spend, so a row is read against its day.
  const dayTotals = useMemo(() => {
    const map = new Map<string, { sale: number; spend: number; count: number }>();
    for (const item of items) {
      const key = dayLabel(item.at);
      const row = map.get(key) ?? { sale: 0, spend: 0, count: 0 };
      if (item.kind === 'order') row.sale += item.amount;
      else row.spend += item.amount;
      row.count += 1;
      map.set(key, row);
    }
    return map;
  }, [items]);

  const isLoading = orders.isLoading || purchases.isLoading;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border bg-muted/40 p-0.5" role="radiogroup" aria-label="Activity filter">
          {FILTERS.map(({ value, label }) => {
            const isActive = value === filter;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setFilter(value)}
                className={cn(
                  'inline-flex h-7 items-center rounded px-2.5 text-xs font-medium transition-colors',
                  isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        {!isLoading && items.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {items.length} most recent {items.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {isLoading ? (
        <ul className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 py-10 text-center">
          <Activity className="h-7 w-7 text-muted-foreground/40" />
          <p className="text-sm font-medium">{filter === 'all' ? 'Nothing has happened yet' : filter === 'order' ? 'No sales yet' : 'No stock purchases yet'}</p>
          <p className="text-xs text-muted-foreground">Sales and stock purchases appear here as they come in.</p>
        </div>
      ) : (
        <ol className="space-y-0.5">
          {items.map((item, i) => {
            const isOrder = item.kind === 'order';
            const label = dayLabel(item.at);
            const showDay = i === 0 || label !== dayLabel(items[i - 1].at);
            const day = dayTotals.get(label);
            const tone = toneFor(item.status);

            return (
              <Fragment key={item.key}>
                {showDay && (
                  <li className={cn('flex items-baseline justify-between gap-3 border-b border-border/70 px-1 pb-1.5', i === 0 ? 'pt-0' : 'pt-4')}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                    <span className="flex shrink-0 items-baseline gap-2 text-[11px] tabular-nums">
                      {!!day?.sale && <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatMoney(day.sale, true)}</span>}
                      {!!day?.spend && <span className="font-semibold text-amber-600 dark:text-amber-400">−{formatMoney(day.spend, true)}</span>}
                    </span>
                  </li>
                )}
                <li>
                  <Link
                    href={item.href}
                    className="group -mx-1 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-1 py-2 transition-colors hover:bg-muted/60 sm:gap-3"
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        isOrder ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      )}
                      aria-hidden
                    >
                      {isOrder ? <ShoppingBag className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium" title={item.subtitle}>
                        {item.subtitle}
                      </span>
                      <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="truncate font-mono" title={item.title}>
                          {item.title}
                        </span>
                        {item.status && (
                          <>
                            <span className={cn('h-1 w-1 shrink-0 rounded-full', tone.dot)} aria-hidden />
                            <span className="shrink-0">{tone.label}</span>
                          </>
                        )}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-1 text-right">
                      <span className="block">
                        <span className={cn('block text-sm font-semibold tabular-nums', isOrder ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                          {isOrder ? '+' : '−'}
                          {formatMoney(item.amount)}
                        </span>
                        <span className="block text-[11px] tabular-nums text-muted-foreground">{format(item.at, 'HH:mm')}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  </Link>
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}
    </div>
  );
}
