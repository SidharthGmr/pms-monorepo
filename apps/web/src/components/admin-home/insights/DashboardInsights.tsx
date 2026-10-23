'use client';
import ImageWithFallback from '@/components/common/image-with-fallback';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetDashboardSummary } from '@/hooks/service-hooks/useDashboardService';
import { useGetLowStockProducts } from '@/hooks/service-hooks/useProductService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Boxes,
  Briefcase,
  FolderTree,
  IndianRupee,
  Plus,
  Ruler,
  ShoppingBag,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import ActivityFeed from './ActivityFeed';
import { CHART_COLORS, ComparisonBars, DonutChart } from './charts';
import { formatCount, formatMoney, percentOf } from './format';
import SalesTrend from './SalesTrend';
import { Accent, ACCENT, EmptyLine, Initials, Panel, Segmented, SURFACE, TrendChip, trendPct } from './widgets';
import { DashboardSummaryDto } from '@pms/types';

interface LowStockProduct {
  id: number;
  name: string;
  sku?: string;
  stock: number;
  lowStockThreshold?: number | null;
  images?: string[];
}

const greetingFor = (hour: number) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

// Staggered entrance so the page settles top to bottom instead of popping in at once.
const enter = (step: number) => ({ className: 'animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500', style: { animationDelay: `${step * 60}ms` } });

interface DashboardInsightsProps {
  /** Rendered inside the hero, beside the page actions. */
  toolbar?: ReactNode;
}

export default function DashboardInsights({ toolbar }: DashboardInsightsProps) {
  const { currentUser } = useGetCurrentUser();
  const summaryQuery = useGetDashboardSummary();
  const lowStockQuery = useGetLowStockProducts();

  const summary: DashboardSummaryDto | undefined = summaryQuery.data?.data?.data;
  const lowStock = ((lowStockQuery.data?.data?.data?.data as LowStockProduct[] | undefined) ?? []).slice(0, 5);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Month figures divided by the days elapsed give a "typical day" to hold today up against; the
  // projection is a straight line, as if every remaining day matched that average.
  const metrics = useMemo(() => {
    const s = summary;
    const monthSale = s?.totalMonthSale ?? 0;
    const monthPurchase = s?.totalMonthPurchase ?? 0;
    const monthOrders = s?.totalMonthOrderCount ?? 0;
    const elapsed = Math.max(1, dayOfMonth);
    return {
      todaySale: s?.todaySale ?? 0,
      monthSale,
      avgDaySale: monthSale / elapsed,
      todayPurchase: s?.todayPurchase ?? 0,
      monthPurchase,
      avgDayPurchase: monthPurchase / elapsed,
      todayOrders: s?.todayOrderCount ?? 0,
      monthOrders,
      avgDayOrders: monthOrders / elapsed,
      netMonth: monthSale - monthPurchase,
      projectedSale: (monthSale / elapsed) * daysInMonth,
    };
  }, [summary, dayOfMonth, daysInMonth]);

  // Stock lives per variant, so the product rows carry none - the distribution is where the API reports it.
  const stockUnits = useMemo(() => (summary?.productDistribution ?? []).reduce((n, d) => n + (d.stock ?? 0), 0), [summary]);

  if (summaryQuery.isError) {
    return (
      <div className={cn(SURFACE, 'py-16 text-center')}>
        <p className="text-sm font-semibold text-destructive">Could not load the dashboard</p>
        <p className="mt-1 text-xs text-muted-foreground">Check your connection and refresh the page.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => summaryQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const isLoading = summaryQuery.isPending;
  const monthPct = percentOf(dayOfMonth, daysInMonth);
  const firstName = currentUser?.name?.trim().split(' ')[0];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. One banner carries the greeting, the day's actions and today's three numbers, so the
             page opens on a single block instead of a plain heading stacked above a card. */}
      <section {...enter(0)}>
        <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-indigo-700 p-5 text-primary-foreground shadow-lg sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '18px 18px' }} aria-hidden />
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-secondary/25 blur-3xl" aria-hidden />

          <div className="relative">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/80">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                  {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                <h1 className="mt-2 text-xl font-bold tracking-tight text-primary-foreground sm:text-2xl">
                  {greetingFor(today.getHours())}
                  {firstName ? `, ${firstName}` : ''}
                </h1>

                {/* The skeleton replaces the whole <p>: a div inside a paragraph is invalid HTML,
                    the parser closes the <p> early, and hydration fails on the mismatch. */}
                {isLoading ? (
                  <Skeleton className="mt-1.5 h-4 w-64 bg-white/20" />
                ) : (
                  <p className="mt-1 max-w-xl text-sm text-primary-foreground/80">
                    {metrics.todayOrders > 0 ? (
                      <>
                        <strong className="font-semibold text-primary-foreground">{formatCount(metrics.todayOrders)}</strong> {metrics.todayOrders === 1 ? 'order' : 'orders'} so far today, worth{' '}
                        <strong className="font-semibold text-primary-foreground">{formatMoney(metrics.todaySale)}</strong>.{' '}
                        {metrics.todaySale >= metrics.avgDaySale ? 'Ahead of a typical day this month.' : 'A slower start than a typical day this month.'}
                      </>
                    ) : (
                      'No orders yet today. Start a sale, or check what is running low.'
                    )}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {toolbar}
                <Button asChild size="sm" variant="outline" className="h-9 border-white/25 bg-white/10 text-primary-foreground backdrop-blur-sm hover:bg-white/20 hover:text-primary-foreground">
                  <Link href="/admin/stock-purchase">
                    <Truck className="h-4 w-4" />
                    Receive stock
                  </Link>
                </Button>
                <Button asChild size="sm" className="h-9 bg-white text-primary shadow-sm hover:bg-white/90">
                  <Link href="/admin/cart">
                    <Plus className="h-4 w-4" />
                    New sale
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_1.5fr]">
              <HeroStat
                label="Sales today"
                value={isLoading ? undefined : formatMoney(metrics.todaySale)}
                delta={isLoading ? undefined : trendPct(metrics.todaySale, metrics.avgDaySale)}
                emphasis
              />
              <HeroStat label="Orders today" value={isLoading ? undefined : formatCount(metrics.todayOrders)} delta={isLoading ? undefined : trendPct(metrics.todayOrders, metrics.avgDayOrders)} />
              <HeroStat label="Stock bought today" value={isLoading ? undefined : formatMoney(metrics.todayPurchase, true)} />

              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm sm:col-span-3 lg:col-span-1">
                <div className="flex items-center justify-between text-[11px] text-primary-foreground/80">
                  <span>Month progress</span>
                  <span className="tabular-nums">
                    Day {dayOfMonth} of {daysInMonth} · {monthPct}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${monthPct}%` }} />
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-primary-foreground/70">Month so far</p>
                    {isLoading ? <Skeleton className="mt-1 h-5 w-20 bg-white/20" /> : <p className="truncate text-base font-bold tabular-nums leading-tight">{formatMoney(metrics.monthSale)}</p>}
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-[11px] text-primary-foreground/70">On track for</p>
                    {isLoading ? <Skeleton className="mt-1 h-5 w-20 bg-white/20" /> : <p className="truncate text-base font-bold tabular-nums leading-tight">{formatMoney(metrics.projectedSale, true)}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The month, in four figures. Each card ends in the two numbers its headline is judged
             against rather than a bar whose denominator nobody can name. */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightKpi
          {...enter(1)}
          icon={IndianRupee}
          accent="emerald"
          label="Sales this month"
          value={isLoading ? undefined : formatMoney(metrics.monthSale)}
          delta={isLoading ? undefined : trendPct(metrics.todaySale, metrics.avgDaySale)}
          left={`Typical day ${formatMoney(metrics.avgDaySale, true)}`}
          right={`${formatMoney(metrics.todaySale, true)} today`}
          href="/admin/orders"
        />
        <InsightKpi
          {...enter(2)}
          icon={ShoppingBag}
          accent="sky"
          label="Orders this month"
          value={isLoading ? undefined : formatCount(metrics.monthOrders)}
          delta={isLoading ? undefined : trendPct(metrics.todayOrders, metrics.avgDayOrders)}
          left={`About ${metrics.avgDayOrders.toFixed(1)} a day`}
          right={`${formatCount(metrics.todayOrders)} today`}
          href="/admin/orders"
        />
        <InsightKpi
          {...enter(3)}
          icon={Truck}
          accent="amber"
          label="Purchases this month"
          value={isLoading ? undefined : formatMoney(metrics.monthPurchase)}
          delta={isLoading ? undefined : trendPct(metrics.todayPurchase, metrics.avgDayPurchase)}
          deltaInverted
          left={`Typical day ${formatMoney(metrics.avgDayPurchase, true)}`}
          right={`${formatMoney(metrics.todayPurchase, true)} today`}
          href="/admin/stock-purchase/history"
        />
        <InsightKpi
          {...enter(4)}
          icon={Wallet}
          accent={metrics.netMonth >= 0 ? 'violet' : 'rose'}
          label="Net this month"
          value={isLoading ? undefined : `${metrics.netMonth < 0 ? '\u2212' : ''}${formatMoney(Math.abs(metrics.netMonth))}`}
          left={`${formatMoney(metrics.monthSale, true)} in`}
          right={`${formatMoney(metrics.monthPurchase, true)} out`}
          note={metrics.monthSale > 0 ? `${percentOf(Math.max(0, metrics.netMonth), metrics.monthSale)}% of sales kept` : undefined}
          href="/admin/orders"
        />
      </section>

      {/* 3. How the money moved: the week's shape and the feed behind it, with the two panels that
             explain it sitting alongside. */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <Panel {...enter(5)} title="Sales, last 7 days" icon={TrendingUp} hint="Completed orders by day; cancelled and returned orders are left out." href="/admin/orders" cta="All orders">
            <SalesTrend days={7} />
          </Panel>

          <Panel {...enter(6)} title="Latest activity" icon={ShoppingBag} hint="Sales and stock purchases, newest first." href="/admin/orders" cta="All orders">
            <ActivityFeed limit={8} />
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel
            {...enter(5)}
            title="Stock watch"
            icon={AlertTriangle}
            count={lowStockQuery.isLoading ? undefined : lowStock.length}
            hint={isLoading ? undefined : `${formatCount(stockUnits)} units on hand across the catalogue.`}
            href="/admin/stock-purchase"
            cta="Receive stock"
          >
            <StockWatch items={lowStock} loading={lowStockQuery.isLoading} />
          </Panel>

          <Panel {...enter(6)} title="Sales vs purchases" icon={IndianRupee} hint="Money in against money out.">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-4/5" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-3/5" />
              </div>
            ) : (
              <ComparisonBars
                aLabel="Sales"
                bLabel="Purchases"
                format={(v) => formatMoney(v, true)}
                rows={[
                  { label: 'Today', a: metrics.todaySale, b: metrics.todayPurchase },
                  { label: 'This month', a: metrics.monthSale, b: metrics.monthPurchase },
                ]}
              />
            )}
          </Panel>
        </div>
      </section>

      {/* 4. What the shop is made of: the catalogue on one side, the people on the other. */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel {...enter(7)} title="Products by category" icon={FolderTree} href="/admin/products" cta="Products">
          <CategoryBreakdown summary={summary} loading={isLoading} />
        </Panel>

        <Panel {...enter(8)} title="People" icon={Users} hint="Newest customers and the team on the books." href="/admin/users" cta="All users" className="xl:col-span-2">
          <PeoplePanel summary={summary} loading={isLoading} />
        </Panel>
      </section>

      <section {...enter(9)}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <CatalogRow icon={Boxes} accent="sky" label="Products" value={summary?.productTotal} recent={summary?.products?.length} href="/admin/products" loading={isLoading} />
          <CatalogRow icon={FolderTree} accent="emerald" label="Categories" value={summary?.categoryTotal} recent={summary?.categories?.length} href="/admin/categories" loading={isLoading} />
          <CatalogRow icon={Tag} accent="violet" label="Brands" value={summary?.brandTotal} recent={summary?.brands?.length} href="/admin/brand-names" loading={isLoading} />
          <CatalogRow icon={Ruler} accent="amber" label="Attributes" value={summary?.attributeTotal} recent={summary?.attributes?.length} href="/admin/master-attributes" loading={isLoading} />
          <CatalogRow icon={Users} accent="rose" label="Customers" value={summary?.customerTotal} recent={summary?.customers?.length} href="/admin/users" loading={isLoading} />
          <CatalogRow icon={Briefcase} accent="indigo" label="Staff" value={summary?.staffTotal} recent={summary?.staff?.length} href="/admin/users" loading={isLoading} />
        </ul>
      </section>
    </div>
  );
}

/* ---------- sections ---------- */

function HeroStat({ label, value, delta, emphasis = false }: { label: string; value?: string; delta?: number | null; emphasis?: boolean }) {
  return (
    <div className={cn('min-w-0 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm', emphasis && 'bg-white/[0.18]')}>
      <p className="truncate text-[11px] text-primary-foreground/70">{label}</p>
      {value === undefined ? (
        <Skeleton className={cn('mt-1.5 h-7 w-24 bg-white/20', emphasis && 'h-8 w-32')} />
      ) : (
        <p className={cn('mt-0.5 truncate font-bold tabular-nums leading-tight', emphasis ? 'text-2xl sm:text-3xl' : 'text-xl')}>{value}</p>
      )}
      {delta !== undefined && (
        <div className="mt-1.5">
          <TrendChip delta={delta} onDark />
        </div>
      )}
    </div>
  );
}

/**
 * A month figure with the two numbers it is read against. An earlier version ended in a progress
 * bar measuring today against the month total, which made every card look nearly empty on the 2nd
 * and nearly full on the 30th without saying anything; this states the comparison instead.
 */
function InsightKpi({
  icon: Icon,
  accent,
  label,
  value,
  delta,
  deltaInverted,
  left,
  right,
  note,
  href,
  className,
  style,
}: {
  icon: React.ElementType;
  accent: Accent;
  label: string;
  value?: string;
  delta?: number | null;
  deltaInverted?: boolean;
  left: string;
  right: string;
  note?: string;
  href: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const a = ACCENT[accent];
  return (
    <Link href={href} className={cn('group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring', className)} style={style}>
      <div className={cn(SURFACE, 'relative flex h-full flex-col overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md')}>
        <div className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent', a.glow)} aria-hidden />

        <div className="relative flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">{label}</p>
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', a.icon)}>
              <Icon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {value === undefined ? <Skeleton className="h-8 w-28" /> : <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>}
            {delta !== undefined && <TrendChip delta={delta} inverted={deltaInverted} />}
          </div>

          {note && <p className="mt-2 truncate text-[11px] text-muted-foreground">{note}</p>}
        </div>

        <div className="relative flex items-center justify-between gap-2 border-t border-border/70 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="truncate">{left}</span>
          <span className="shrink-0 truncate font-medium text-foreground/70">{right}</span>
        </div>
      </div>
    </Link>
  );
}

function StockWatch({ items, loading }: { items: LowStockProduct[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) return <EmptyLine icon={Boxes} text="Everything is above its low-stock threshold." tone="good" />;

  return (
    <ul className="space-y-3">
      {items.map((product) => {
        const threshold = product.lowStockThreshold || 5;
        const ratio = Math.min(100, Math.round((product.stock / threshold) * 100));
        const critical = product.stock === 0;
        return (
          <li key={product.id}>
            <Link href={`/admin/products?search=${encodeURIComponent(product.name)}`} className="group flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                <ImageWithFallback
                  src={product.images?.[0]}
                  className="h-full w-full object-cover"
                  fallback={<Boxes className="h-4 w-4 text-muted-foreground/50" />}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium group-hover:underline">{product.name}</span>
                  <span className={cn('shrink-0 rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums', critical ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400')}>
                    {critical ? 'Out' : `${product.stock} left`}
                  </span>
                </div>
                <Progress value={ratio} className={cn('mt-1.5 h-1.5', critical ? '[&>div]:bg-destructive' : '[&>div]:bg-amber-500')} />
                <p className="mt-1 text-[10px] text-muted-foreground">Threshold {threshold}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryBreakdown({ summary, loading }: { summary?: DashboardSummaryDto; loading: boolean }) {
  // Products counts how many items sit in each category; stock adds up the units they hold.
  const [mode, setMode] = useState<'count' | 'stock'>('count');
  const [active, setActive] = useState<string | null>(null);

  const slices = useMemo(() => {
    const rows = [...(summary?.productDistribution ?? [])].sort((a, b) => b[mode] - a[mode]);
    const top = rows.slice(0, 6);
    const rest = rows.slice(6);
    const out = top.map((r, i) => ({ label: r.name, value: r[mode], color: CHART_COLORS[i % CHART_COLORS.length] }));
    if (rest.length) out.push({ label: `Other (${rest.length})`, value: rest.reduce((n, r) => n + r[mode], 0), color: '#94a3b8' });
    return out;
  }, [summary, mode]);

  const total = slices.reduce((n, s) => n + s.value, 0);
  const shown = active ? slices.find((s) => s.label === active) : null;

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-36 w-36 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (slices.length === 0) return <EmptyLine icon={Boxes} text="Add products and they will be grouped here by category." />;

  return (
    <div className="space-y-3">
      <Segmented
        value={mode}
        onChange={setMode}
        label="Measure"
        options={[
          { value: 'count', label: 'Products' },
          { value: 'stock', label: 'Units in stock' },
        ]}
      />
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <DonutChart
          slices={slices.map((s) => ({ ...s, color: active && s.label !== active ? `${s.color}55` : s.color }))}
          size={144}
          thickness={16}
          centerLabel={formatCount(shown ? shown.value : total)}
          centerSub={shown ? `${percentOf(shown.value, total)}% · ${shown.label}` : mode === 'count' ? 'products' : 'units'}
        />
        <ul className="w-full min-w-0 flex-1 space-y-0.5 text-xs" onMouseLeave={() => setActive(null)}>
          {slices.map((slice) => (
            <li
              key={slice.label}
              onMouseEnter={() => setActive(slice.label)}
              className={cn('flex cursor-default items-center gap-2 rounded px-1.5 py-1 transition-colors', active === slice.label && 'bg-muted/60')}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: slice.color }} />
              <span className="min-w-0 flex-1 truncate">{slice.label}</span>
              <span className="w-8 text-right tabular-nums text-muted-foreground">{percentOf(slice.value, total)}%</span>
              <span className="w-10 text-right font-medium tabular-nums">{formatCount(slice.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PeoplePanel({ summary, loading }: { summary?: DashboardSummaryDto; loading: boolean }) {
  const customers = (summary?.customers ?? []).slice(0, 5);
  const staff = (summary?.staff ?? []).slice(0, 5);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 sm:divide-x sm:divide-border/70">
        {[0, 1].map((col) => (
          <div key={col} className={cn('space-y-3', col === 1 && 'sm:pl-6')}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:divide-x sm:divide-border/70">
      <PeopleList
        title="New customers"
        total={summary?.customerTotal}
        href="/admin/users?role=USER"
        emptyText="No customers yet. They appear here as soon as someone registers or places an order."
        people={customers.map((c) => ({ id: c.id, name: c.name, sub: c.email || c.phone || '', when: c.createdAt, active: c.isActive, badge: c.isActive ? null : 'Inactive' }))}
      />
      <PeopleList
        title="Team"
        total={summary?.staffTotal}
        href="/admin/users?role=STAFF"
        emptyText="No staff added yet. Add team members from Users."
        className="sm:pl-6"
        people={staff.map((s) => ({
          id: s.id,
          name: s.user?.name || `Staff #${s.id}`,
          sub: [s.position, s.department].filter(Boolean).join(' · ') || s.user?.email || '',
          when: s.createdAt,
          active: s.isActive,
          badge: s.isActive ? 'Active' : 'Inactive',
        }))}
      />
    </div>
  );
}

interface Person {
  id: number;
  name: string;
  sub: string;
  when: Date | string;
  active: boolean;
  badge: string | null;
}

// One column of the People panel: heading with the store-wide total, then compact rows that
// link to the user list. The newest person is marked so the list reads as a feed.
function PeopleList({ title, total, href, emptyText, people, className }: { title: string; total?: number; href: string; emptyText: string; people: Person[]; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
          {total !== undefined && <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{formatCount(total)}</span>}
        </h3>
        <Link href={href} className="text-[11px] font-medium text-primary hover:underline">
          View
        </Link>
      </div>

      {people.length === 0 ? (
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-3 text-xs text-muted-foreground">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {emptyText}
        </div>
      ) : (
        <ul className="-mx-2">
          {people.map((p, index) => (
            <li key={p.id}>
              <Link href={`/admin/users?search=${encodeURIComponent(p.name)}`} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                <Initials name={p.name} active={p.active} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium leading-tight">
                    <span className="truncate group-hover:underline">{p.name}</span>
                    {index === 0 && <span className="shrink-0 rounded bg-primary/10 px-1 text-[9px] font-semibold uppercase tracking-wide text-primary">New</span>}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{p.sub || '—'}</p>
                </div>
                <div className="shrink-0 text-right">
                  {p.badge && (
                    <span className={cn('block text-[10px] font-semibold', p.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>{p.badge}</span>
                  )}
                  <span className="block text-[10px] text-muted-foreground" title={p.when ? new Date(p.when).toLocaleString('en-IN') : ''}>
                    {p.when ? formatDistanceToNow(new Date(p.when), { addSuffix: true }) : ''}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CatalogRow({ icon: Icon, accent, label, value, recent, href, loading }: { icon: React.ElementType; accent: Accent; label: string; value?: number; recent?: number; href: string; loading: boolean }) {
  return (
    <li className="min-w-0">
      <Link href={href} className="group flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', ACCENT[accent].icon)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-0.5 h-4 w-10" />
          ) : (
            <p className="flex items-baseline gap-1.5 text-sm font-semibold tabular-nums leading-tight">
              {formatCount(value ?? 0)}
              {!!recent && <span className="truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400">+{recent} recent</span>}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
