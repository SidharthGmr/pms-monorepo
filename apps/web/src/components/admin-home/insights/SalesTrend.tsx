'use client';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderDto } from '@/dtos/order.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { cn } from '@/lib/utils';
import { format, isSameDay, startOfDay, subDays } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { formatCount, formatMoney } from './format';

// The orders API has no date filter, so the newest orders are fetched and bucketed by day here.
// FETCH_LIMIT is comfortably above a week of orders for the stores this serves; if a store ever
// outgrows it the chart says so rather than silently under-counting.
const FETCH_LIMIT = 200;
const EXCLUDED: string[] = [OrderStatus.Cancelled, OrderStatus.Returned];

interface DayBucket {
  date: Date;
  label: string;
  sales: number;
  orders: number;
}

export default function SalesTrend({ days = 7 }: { days?: number }) {
  const { data, isLoading, isError } = useGetAllOrders({ page: 1, recordPerPage: FETCH_LIMIT });
  const orders = useMemo(() => (data?.data?.data?.data as OrderDto[] | undefined) ?? [], [data]);

  const { buckets, truncated } = useMemo(() => {
    const today = startOfDay(new Date());
    const list: DayBucket[] = Array.from({ length: days }, (_, i) => {
      const date = subDays(today, days - 1 - i);
      return { date, label: format(date, 'EEE'), sales: 0, orders: 0 };
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
        <div className="flex gap-6">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex h-40 items-end gap-2">
          {Array.from({ length: days }).map((_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${30 + ((i * 37) % 60)}%` }} />
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
      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <dt className="text-[11px] text-muted-foreground">Sales, {days} days</dt>
          <dd className="text-lg font-bold tabular-nums leading-tight sm:text-xl">{formatMoney(totals.sales)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">Orders</dt>
          <dd className="text-lg font-bold tabular-nums leading-tight sm:text-xl">{formatCount(totals.count)}</dd>
        </div>
        {totals.best && totals.best.sales > 0 && (
          <div>
            <dt className="text-[11px] text-muted-foreground">Best day</dt>
            <dd className="text-lg font-bold leading-tight sm:text-xl">
              {format(totals.best.date, 'EEE')} <span className="text-sm font-medium text-muted-foreground">{formatMoney(totals.best.sales, true)}</span>
            </dd>
          </div>
        )}
      </dl>

      {totals.count === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
          <p className="text-sm font-medium">No sales in the last {days} days</p>
          <p className="text-xs text-muted-foreground">Completed orders will chart here day by day.</p>
        </div>
      ) : (
        <div role="img" aria-label={`Daily sales for the last ${days} days`} className="flex h-44 items-end gap-1.5 sm:gap-3">
          {buckets.map((b) => {
            const isToday = isSameDay(b.date, new Date());
            const height = b.sales > 0 ? Math.max(4, (b.sales / totals.max) * 100) : 0;
            return (
              <div key={b.label + b.date.getDate()} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" title={`${format(b.date, 'EEE d MMM')}: ${formatMoney(b.sales)} from ${b.orders} ${b.orders === 1 ? 'order' : 'orders'}`}>
                <span className={cn('hidden text-[10px] font-medium tabular-nums text-muted-foreground sm:block', b.sales === 0 && 'invisible')}>{formatMoney(b.sales, true)}</span>
                <div className="flex w-full flex-1 items-end rounded-md bg-muted/40">
                  <div
                    className={cn('w-full rounded-md transition-[height] duration-500', isToday ? 'bg-primary' : 'bg-primary/35 group-hover:bg-primary/60')}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className={cn('text-[11px] tabular-nums', isToday ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{isToday ? 'Today' : b.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {truncated && <p className="text-[11px] text-muted-foreground">Only the latest {FETCH_LIMIT} orders were counted, so earlier days may be under-reported.</p>}
    </div>
  );
}
