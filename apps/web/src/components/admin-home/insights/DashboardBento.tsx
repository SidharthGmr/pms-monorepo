'use client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetDashboardSummary } from '@/hooks/service-hooks/useDashboardService';
import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { useGetLowStockProducts } from '@/hooks/service-hooks/useProductService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowRight, BarChart3, Boxes, CheckCircle2, FolderTree, Package, Plus, Receipt, ShoppingBag, Tags, Truck, Trophy, Undo2, Users, Wallet } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { format } from 'date-fns';
import { bucketOrdersByDay, FETCH_LIMIT } from './daily-buckets';
import DayColumns from './day-columns';
import { formatCount, formatMoney } from './format';
import Sparkline from './sparkline';
import { toneFor } from '@/components/features/orders/order-status';
import { trendPct } from './widgets';
import { DashboardSummaryDto, OrderDto } from '@pms/types';

interface LowStockProduct {
  id: number;
  name: string;
  sku?: string;
  stock: number;
  lowStockThreshold?: number | null;
}

/* The bento variant: a dark hero carrying the one number the day is judged on, then tiles of
 * mixed weight around it. Where Focus leads with tasks and Insights with analysis, this one is
 * read at a glance from across the counter - big figures, live shapes, short lists.
 *
 * The series are real: the orders API has no date filter, so a page of recent orders is
 * bucketed by day (see daily-buckets.ts) rather than drawing a decorative squiggle. */

const TILE = 'rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm';
const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground';

const TREND_DAYS = 14;
const RECENT_INVOICES = 6;

// Decorative identity accents for the avatar initials - the name is always printed beside
// them, so the hue carries no information a reader depends on.
const AVATAR_TONES = [
  'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'bg-rose-500/15 text-rose-700 dark:text-rose-400',
];

function CustomerAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
  const tone = AVATAR_TONES[name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_TONES.length];
  return <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', tone)}>{initials || '?'}</span>;
}

const enter = (step: number) => ({
  className: 'animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500',
  style: { animationDelay: `${step * 60}ms` },
});

function Tile({ className, children, step = 0 }: { className?: string; children: ReactNode; step?: number }) {
  const animation = enter(step);
  return (
    <section className={cn(TILE, 'min-w-0 p-4 sm:p-5', animation.className, className)} style={animation.style}>
      {children}
    </section>
  );
}

function Delta({ delta, inverted = false, onDark = false }: { delta: number | null | undefined; inverted?: boolean; onDark?: boolean }) {
  if (delta === undefined) return <Skeleton className={cn('h-4 w-24', onDark && 'bg-white/20')} />;
  if (delta === null) return <span className={cn('text-[11px]', onDark ? 'text-primary-foreground/70' : 'text-muted-foreground')}>No baseline yet</span>;
  const up = delta > 0;
  const good = delta === 0 ? null : inverted ? !up : up;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
        onDark ? 'bg-white/15 text-primary-foreground' : good === null ? 'bg-muted text-muted-foreground' : good ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
      )}
    >
      {up ? '+' : ''}
      {delta}% <span className={cn('font-normal', onDark ? 'text-primary-foreground/70' : 'opacity-70')}>vs typical day</span>
    </span>
  );
}

export default function DashboardBento({ toolbar }: { toolbar?: ReactNode }) {
  const { currentUser } = useGetCurrentUser();
  const summaryQuery = useGetDashboardSummary();
  const lowStockQuery = useGetLowStockProducts();
  const trendQuery = useGetAllOrders({ page: 1, recordPerPage: FETCH_LIMIT });
  // Only the count is wanted, so one row is enough - the API still reports the full total.
  const pendingQuery = useGetAllOrders({ status: 'PENDING', recordPerPage: 1 });

  const summary: DashboardSummaryDto | undefined = summaryQuery.data?.data?.data;
  const lowStockAll = (lowStockQuery.data?.data?.data?.data as LowStockProduct[] | undefined) ?? [];
  const pendingOrders = pendingQuery.data?.data?.data?.totalRecord ?? 0;

  const outOfStock = lowStockAll.filter((product) => (product.stock ?? 0) <= 0);
  const attention = [...outOfStock, ...lowStockAll.filter((product) => (product.stock ?? 0) > 0)].slice(0, 5);

  const recentOrders = useMemo(() => (trendQuery.data?.data?.data?.data as OrderDto[] | undefined) ?? [], [trendQuery.data]);
  // The same page of orders feeds the trend and this list, so the tile costs no extra request.
  const latestInvoices = useMemo(() => [...recentOrders].slice(0, RECENT_INVOICES), [recentOrders]);
  const buckets = useMemo(() => bucketOrdersByDay(recentOrders, TREND_DAYS), [recentOrders]);
  const salesSeries = useMemo(() => buckets.map((bucket) => ({ label: format(bucket.date, 'd MMM'), value: bucket.sales })), [buckets]);
  const orderSeries = useMemo(() => buckets.map((bucket) => ({ label: format(bucket.date, 'd MMM'), value: bucket.orders })), [buckets]);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const metrics = useMemo(() => {
    const monthSale = summary?.totalMonthSale ?? 0;
    const monthPurchase = summary?.totalMonthPurchase ?? 0;
    const monthOrders = summary?.totalMonthOrderCount ?? 0;
    const elapsed = Math.max(1, dayOfMonth);
    return {
      todaySale: summary?.todaySale ?? 0,
      monthSale,
      avgDaySale: monthSale / elapsed,
      todayPurchase: summary?.todayPurchase ?? 0,
      monthPurchase,
      avgDayPurchase: monthPurchase / elapsed,
      todayOrders: summary?.todayOrderCount ?? 0,
      monthOrders,
      avgDayOrders: monthOrders / elapsed,
      monthRefund: summary?.totalMonthRefund ?? 0,
      netMonth: monthSale - monthPurchase,
      projected: (monthSale / elapsed) * daysInMonth,
    };
  }, [summary, dayOfMonth, daysInMonth]);

  if (summaryQuery.isError) {
    return (
      <div className={cn(TILE, 'py-16 text-center')}>
        <p className="text-sm font-semibold text-destructive">Could not load the dashboard</p>
        <p className="mt-1 text-xs text-muted-foreground">Check your connection and refresh the page.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => summaryQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const isLoading = summaryQuery.isPending;
  const firstName = currentUser?.name?.trim().split(' ')[0];

  const topProducts = (summary?.productDistribution ?? []).slice(0, 5);
  const topSold = Math.max(1, ...topProducts.map((product) => product.count));

  const census = [
    { label: 'Products', value: summary?.productTotal, href: '/admin/products', icon: Package },
    { label: 'Categories', value: summary?.categoryTotal, href: '/admin/categories', icon: FolderTree },
    { label: 'Brands', value: summary?.brandTotal, href: '/admin/brand-names', icon: Tags },
    { label: 'Customers', value: summary?.customerTotal, href: '/admin/users', icon: Users },
  ];

  return (
    <div className="space-y-4">
      {/* Hero: the day's takings, its shape, and the two actions a counter starts from. */}
      <section
        {...enter(0)}
        className={cn('relative overflow-hidden rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-sm sm:px-7 sm:py-6', enter(0).className)}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
              {format(today, 'EEEE, d MMMM')} · {firstName ? `${firstName}'s counter` : 'Today'}
            </p>
            {isLoading ? (
              <Skeleton className="mt-3 h-11 w-56 bg-white/20" />
            ) : (
              <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">{formatMoney(metrics.todaySale)}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Delta delta={isLoading ? undefined : trendPct(metrics.todaySale, metrics.avgDaySale)} onDark />
              <span className="text-[11px] text-primary-foreground/70">
                {formatCount(metrics.todayOrders)} {metrics.todayOrders === 1 ? 'invoice' : 'invoices'} today
              </span>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[300px]">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">Last {TREND_DAYS} days</p>
              {trendQuery.isPending ? (
                <Skeleton className="mt-2 h-11 w-full bg-white/20" />
              ) : (
                <Sparkline points={salesSeries} color="#ffffff" height={40} onDark readout={false} format={(value) => formatMoney(value, true)} className="mt-1" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {toolbar}
              <Button asChild size="sm" variant="outline" className="h-9 border-white/25 bg-white/10 text-primary-foreground backdrop-blur-sm hover:bg-white/20 hover:text-primary-foreground">
                <Link href="/admin/orders">
                  <Plus className="h-4 w-4" />
                  New invoice
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Sales, month to date - the widest tile, with the same series at full width. */}
        <Tile step={1} className="md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={LABEL}>Sales this month</p>
              {isLoading ? <Skeleton className="mt-2 h-8 w-32" /> : <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight">{formatMoney(metrics.monthSale)}</p>}
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          {trendQuery.isPending ? (
            <Skeleton className="mt-4 h-14 w-full" />
          ) : (
            <Sparkline points={salesSeries} height={52} format={(value) => formatMoney(value, true)} className="mt-3" />
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground">
            <span>
              Typical day <strong className="font-semibold text-foreground">{formatMoney(metrics.avgDaySale, true)}</strong>
            </span>
            <span>
              On track for <strong className="font-semibold text-foreground">{formatMoney(metrics.projected, true)}</strong>
            </span>
          </div>
        </Tile>

        {/* Invoices */}
        <Tile step={2}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={LABEL}>Invoices today</p>
              {isLoading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight">{formatCount(metrics.todayOrders)}</p>}
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          {trendQuery.isPending ? (
            <Skeleton className="mt-4 h-10 w-full" />
          ) : (
            <Sparkline points={orderSeries} height={36} format={(value) => `${value} ${Number(value) === 1 ? 'invoice' : 'invoices'}`} className="mt-3" />
          )}
          <p className="mt-3 border-t pt-3 text-[11px] text-muted-foreground">
            {formatCount(metrics.monthOrders)} this month · typical day {metrics.avgDayOrders.toFixed(1)}
          </p>
        </Tile>

        {/* Latest invoices - what the donut used to occupy. */}
        <Tile step={3} className="xl:row-span-2">
          <div className="flex items-start justify-between gap-3">
            <p className={LABEL}>Latest invoices</p>
            <Link href="/admin/orders" className="group inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
              All
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {trendQuery.isPending ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : latestInvoices.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center">
              <Receipt className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No invoices yet.</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-1">
              {latestInvoices.map((order) => {
                const tone = toneFor(order.status);
                const customer = order.customer?.name || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Walk-in customer';
                const placed = order.createdAt ? formatDistanceToNowStrict(new Date(order.createdAt), { addSuffix: true }) : '';
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="group relative flex items-center gap-2.5 rounded-xl border border-transparent py-2 pl-3.5 pr-2 transition-all hover:border-border hover:bg-muted/40"
                    >
                      <span className={cn('absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full', tone.dot)} title={tone.label} />
                      <CustomerAvatar name={customer} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold group-hover:underline" title={customer}>
                          {customer}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-muted-foreground" title={order.orderNumber}>
                          {order.orderNumber}
                          {placed ? ` · ${placed}` : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs font-bold tabular-nums">{formatMoney(Number(order.grandTotal ?? 0), true)}</span>
                        <span className={cn('block text-[10px] font-medium', tone.text)}>{tone.label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>

        {/* Stock alerts */}
        <Tile step={4} className="md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className={LABEL}>Needs attention</p>
              {lowStockAll.length > 0 && (
                <span className="rounded-full bg-amber-500/10 px-1.5 text-[10px] font-semibold tabular-nums text-amber-700 dark:text-amber-400">{lowStockAll.length}</span>
              )}
            </div>
            <Link href="/admin/products" className="group inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
              All products
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <Link
            href="/admin/orders?status=PENDING"
            className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Invoices awaiting confirmation
            </span>
            <span className={cn('tabular-nums font-semibold', pendingOrders > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>{formatCount(pendingOrders)}</span>
          </Link>

          {lowStockQuery.isPending ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          ) : attention.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-3 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Every item is above its stock threshold.
            </div>
          ) : (
            <ul className="mt-3 space-y-1">
              {attention.map((product) => {
                const out = (product.stock ?? 0) <= 0;
                const threshold = product.lowStockThreshold || 5;
                const ratio = Math.min(100, Math.round(((product.stock ?? 0) / threshold) * 100));
                return (
                  <li key={product.id}>
                    <Link
                      href={`/admin/products?search=${encodeURIComponent(product.name)}`}
                      className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                    >
                      <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', out ? 'text-rose-500' : 'text-amber-500')} />
                      <span className="min-w-0 flex-1 truncate text-xs group-hover:underline" title={product.name}>
                        {product.name}
                      </span>
                      <span className="hidden h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
                        <span className={cn('block h-full rounded-full', out ? 'bg-rose-500' : 'bg-amber-500')} style={{ width: `${Math.max(ratio, out ? 0 : 4)}%` }} />
                      </span>
                      <span className={cn('w-16 shrink-0 text-right text-[11px] font-semibold tabular-nums', out ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')}>
                        {out ? 'out' : `${product.stock} left`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>

        {/* Money out */}
        <Tile step={5}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={LABEL}>Spent on stock</p>
              {isLoading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{formatMoney(metrics.monthPurchase)}</p>}
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Net this month</span>
                <span className={cn('font-semibold tabular-nums', metrics.netMonth < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                  {formatMoney(metrics.netMonth, true)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${metrics.monthSale > 0 ? Math.min(100, Math.round((metrics.monthPurchase / metrics.monthSale) * 100)) : 0}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Purchases as a share of sales</p>
            </div>
            {metrics.monthRefund > 0 && (
              <div className="flex items-center justify-between border-t pt-2.5 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Undo2 className="h-3 w-3" />
                  Refunded
                </span>
                <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">{formatMoney(metrics.monthRefund, true)}</span>
              </div>
            )}
          </div>
        </Tile>

        {/* Census strip */}
        <Tile step={6} className="md:col-span-2 xl:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {census.map((entry) => (
              <Link key={entry.label} href={entry.href} className="group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <entry.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] text-muted-foreground">{entry.label}</span>
                  {entry.value === undefined ? <Skeleton className="mt-0.5 h-4 w-10" /> : <span className="block text-base font-bold tabular-nums leading-tight">{formatCount(entry.value)}</span>}
                </span>
              </Link>
            ))}
          </div>
        </Tile>

        {/* Day by day: two aligned charts, never one with two y-axes. */}
        <Tile step={7} className="md:col-span-2 xl:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={LABEL}>Sales &amp; invoices, day by day</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Last {TREND_DAYS} days · hover a column for that date</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </span>
          </div>
          {trendQuery.isPending ? <Skeleton className="mt-4 h-[150px] w-full" /> : <DayColumns buckets={buckets} formatMoney={formatMoney} className="mt-4" />}
        </Tile>

        {/* Top products, ranked by units: one measure, so bars and direct labels beat a donut. */}
        <Tile step={8} className="md:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <p className={LABEL}>Top products</p>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-4 w-4" />
            </span>
          </div>
          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-20 w-full" />
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
              <Boxes className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Nothing sold yet.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              {/* The leader gets a card of its own; the chasers get data-bar rows, where the
                  tint behind the row is the share itself. */}
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Trophy className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Best seller</span>
                    <span className="block truncate text-sm font-bold" title={topProducts[0].name}>
                      {topProducts[0].name}
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-primary/15 pt-2">
                  <span className="text-lg font-bold tabular-nums leading-none">{formatCount(topProducts[0].count)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    units · <strong className="font-semibold text-foreground">{topProducts[0].percentage}%</strong> of sales
                  </span>
                </div>
              </div>

              <ol className="space-y-1">
                {topProducts.slice(1).map((product, index) => (
                  <li
                    key={product.name}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
                    style={{ background: `linear-gradient(to right, hsl(var(--primary) / 0.09) ${Math.max(4, (product.count / topSold) * 100)}%, transparent ${Math.max(4, (product.count / topSold) * 100)}%)` }}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-muted-foreground">
                      {index + 2}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs" title={product.name}>
                      {product.name}
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums">{formatCount(product.count)}</span>
                    <span className="w-9 shrink-0 rounded-full bg-muted px-1 text-center text-[10px] font-medium tabular-nums text-muted-foreground">
                      {product.percentage}%
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Tile>
      </div>
    </div>
  );
}
