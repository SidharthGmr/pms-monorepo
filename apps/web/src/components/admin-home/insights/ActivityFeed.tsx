'use client';
import { Fragment, useMemo } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Activity, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { OrderDto } from '@/dtos/order.dto';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { useGetAllPurchases } from '@/hooks/service-hooks/usePurchaseService';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatMoney } from './format';

type FeedItem = {
  key: string;
  kind: 'order' | 'purchase';
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  at: Date;
  href: string;
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  [OrderStatus.Pending]: 'bg-amber-100 text-amber-700',
  [OrderStatus.Confirmed]: 'bg-sky-100 text-sky-700',
  [OrderStatus.Shipped]: 'bg-indigo-100 text-indigo-700',
  [OrderStatus.Delivered]: 'bg-emerald-100 text-emerald-700',
  [OrderStatus.Cancelled]: 'bg-rose-100 text-rose-700',
  [OrderStatus.Returned]: 'bg-zinc-100 text-zinc-700',
};

const dayLabel = (d: Date) => (isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEE, d MMM'));

// Sales and purchases in one timeline, newest first and grouped by day, so the last few things
// that happened in the store read as a single story instead of two side-by-side lists.
export default function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const orders = useGetAllOrders({ page: 1, recordPerPage: limit });
  const purchases = useGetAllPurchases({ page: 1, recordPerPage: limit });

  const items = useMemo<FeedItem[]>(() => {
    const orderItems: FeedItem[] = ((orders.data?.data?.data?.data as OrderDto[] | undefined) ?? []).map((o) => ({
      key: `o-${o.id}`,
      kind: 'order',
      title: o.orderNumber,
      subtitle: o.customer ? `${o.customer.firstName ?? ''} ${o.customer.lastName ?? ''}`.trim() || 'Walk-in' : o.createdByName || 'Walk-in',
      amount: o.grandTotal ?? 0,
      status: o.status,
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
    return [...orderItems, ...purchaseItems].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
  }, [orders.data, purchases.data, limit]);

  const isLoading = orders.isLoading || purchases.isLoading;

  if (isLoading) {
    return (
      <ul className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Activity className="h-7 w-7 text-muted-foreground/40" />
        <p className="text-sm font-medium">Nothing has happened yet</p>
        <p className="text-xs text-muted-foreground">Orders and stock purchases will show up here as they come in.</p>
      </div>
    );
  }

  return (
    <ol className="relative">
      {/* Timeline rail behind the icons. */}
      <span className="absolute bottom-3 left-[17px] top-3 w-px bg-border" aria-hidden />
      {items.map((item, i) => {
        const isOrder = item.kind === 'order';
        const showDay = i === 0 || dayLabel(item.at) !== dayLabel(items[i - 1].at);
        return (
          <Fragment key={item.key}>
            {showDay && (
              <li className="relative z-10 flex items-center gap-3 py-1.5 first:pt-0">
                <span className="ml-[9px] h-4 w-4 rounded-full border-2 border-background bg-muted" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{dayLabel(item.at)}</span>
              </li>
            )}
            <li>
              <Link href={item.href} className="group relative z-10 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm',
                    isOrder ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  )}
                  aria-hidden
                >
                  {isOrder ? <ShoppingBag className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm font-semibold">{item.title}</span>
                    <span className={cn('rounded-full px-1.5 py-0 text-[10px] font-medium capitalize', ORDER_STATUS_STYLE[item.status] ?? 'bg-muted text-muted-foreground')}>
                      {item.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {isOrder ? 'Sale to' : 'Stock from'} <span className="text-foreground/80">{item.subtitle}</span> · {formatDistanceToNow(item.at, { addSuffix: true })}
                  </p>
                </div>
                <span className={cn('shrink-0 text-sm font-semibold tabular-nums', isOrder ? 'text-emerald-600' : 'text-amber-600')}>
                  {isOrder ? '+' : '−'}
                  {formatMoney(item.amount)}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
