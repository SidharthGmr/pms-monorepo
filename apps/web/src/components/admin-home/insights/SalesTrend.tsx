'use client';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { format } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { bucketOrdersByDay, DayBucket, FETCH_LIMIT } from './daily-buckets';
import DayColumns from './day-columns';
import { formatCount, formatMoney } from './format';
import { OrderDto } from '@pms/types';

/**
 * The week's sales as the shared date-wise chart: the rupee series as a smoothed area, invoice
 * counts as the volume strip beneath, and a readout that always names a date with both figures -
 * the same component the Command dashboard uses, so the two dashboards read alike.
 */
export default function SalesTrend({ days = 7 }: { days?: number }) {
  const { data, isLoading, isError } = useGetAllOrders({ page: 1, recordPerPage: FETCH_LIMIT });
  const orders = useMemo(() => (data?.data?.data?.data as OrderDto[] | undefined) ?? [], [data]);

  const { buckets, truncated } = useMemo(() => {
    const list = bucketOrdersByDay(orders, days);
    const oldest = orders.length ? new Date(orders[orders.length - 1].createdAt) : null;
    return { buckets: list, truncated: orders.length >= FETCH_LIMIT && !!oldest && oldest > list[0].date };
  }, [orders, days]);

  const totals = useMemo(() => {
    const sales = buckets.reduce((n, b) => n + b.sales, 0);
    const count = buckets.reduce((n, b) => n + b.orders, 0);
    const best = buckets.reduce<DayBucket | null>((acc, b) => (b.sales > (acc?.sales ?? 0) ? b : acc), null);
    return { sales, count, best };
  }, [buckets]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-6">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-28 w-full" />
        <div className="flex items-end gap-1.5">
          {Array.from({ length: days }).map((_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${12 + ((i * 11) % 20)}px` }} />
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
              {format(totals.best.date, 'EEE, d MMM')} <span className="text-sm font-medium text-muted-foreground">{formatMoney(totals.best.sales, true)}</span>
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
        <DayColumns buckets={buckets} formatMoney={formatMoney} />
      )}

      {truncated && <p className="text-[11px] text-muted-foreground">Only the latest {FETCH_LIMIT} orders were counted, so earlier days may be under-reported.</p>}
    </div>
  );
}
