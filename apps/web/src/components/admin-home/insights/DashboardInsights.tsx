'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Briefcase,
  CalendarDays,
  FolderTree,
  IndianRupee,
  Minus,
  PackagePlus,
  Plus,
  Ruler,
  ShoppingBag,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { DashboardSummaryDto } from '@/dtos/dashboard-summary.dto';
import { useGetDashboardSummary } from '@/hooks/service-hooks/useDashboardService';
import { useGetLowStockProducts } from '@/hooks/service-hooks/useProductService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import ActivityFeed from './ActivityFeed';
import { CHART_COLORS, ComparisonBars, DonutChart } from './charts';
import { formatCount, formatMoney, percentOf } from './format';

interface LowStockProduct {
  id: number;
  name: string;
  sku?: string;
  stock: number;
  lowStockThreshold?: number | null;
  images?: string[];
}

const greetingFor = (hour: number) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

// Only routes that exist under app/admin.
const QUICK_ACTIONS = [
  { label: 'New sale', href: '/admin/checkout', icon: ShoppingBag },
  { label: 'Add product', href: '/admin/products', icon: PackagePlus },
  { label: 'Receive stock', href: '/admin/stock-purchase', icon: Truck },
  { label: 'Add category', href: '/admin/categories', icon: Plus },
];

// Staggered entrance so the page settles top to bottom instead of popping in at once.
const enter = (step: number) => ({ className: 'animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500', style: { animationDelay: `${step * 70}ms` } });

export default function DashboardInsights() {
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
      netToday: (s?.todaySale ?? 0) - (s?.todayPurchase ?? 0),
      netMonth: monthSale - monthPurchase,
      projectedSale: (monthSale / elapsed) * daysInMonth,
    };
  }, [summary, dayOfMonth, daysInMonth]);

  const stockUnits = useMemo(() => (summary?.products ?? []).reduce((n, p) => n + (p.stock ?? 0), 0), [summary]);

  if (summaryQuery.isError) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load the dashboard</p>
        <p className="mt-1 text-xs text-muted-foreground">Check your connection and refresh the page.</p>
      </Card>
    );
  }

  const isLoading = summaryQuery.isPending;
  const monthPct = percentOf(dayOfMonth, daysInMonth);

  return (
    <div className="space-y-5">
      <section {...enter(0)}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-indigo-700 text-primary-foreground shadow-lg">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '18px 18px' }}
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" aria-hidden />

          <div className="relative grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8 lg:py-8">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-primary-foreground/90">
                <CalendarDays className="h-3.5 w-3.5" />
                {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {greetingFor(today.getHours())}
                  {currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''} 👋
                </h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-primary-foreground/85">
                  {isLoading ? (
                    <Skeleton className="h-4 w-72 bg-white/20" />
                  ) : metrics.todayOrders > 0 ? (
                    <>
                      <strong className="font-semibold text-primary-foreground">{formatCount(metrics.todayOrders)}</strong> {metrics.todayOrders === 1 ? 'order' : 'orders'} so far
                      today, worth <strong className="font-semibold text-primary-foreground">{formatMoney(metrics.todaySale)}</strong>.{' '}
                      {metrics.todaySale >= metrics.avgDaySale ? 'You are ahead of a typical day this month.' : 'A slower start than a typical day this month.'}
                    </>
                  ) : (
                    'No orders yet today. Start a sale, or check what is running low.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
                  <Button key={href} asChild size="sm" variant="white" className="h-8 gap-1.5 border border-white/20 bg-white/10 text-primary-foreground hover:bg-white hover:text-primary">
                    <Link href={href}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <HeroStat label="Sales today" value={isLoading ? undefined : formatMoney(metrics.todaySale)} delta={isLoading ? undefined : trendPct(metrics.todaySale, metrics.avgDaySale)} deltaLabel="vs typical day" />
                <HeroStat label="Orders today" value={isLoading ? undefined : formatCount(metrics.todayOrders)} delta={isLoading ? undefined : trendPct(metrics.todayOrders, metrics.avgDayOrders)} deltaLabel="vs typical day" />
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[11px] text-primary-foreground/80">
                  <span>
                    Day {dayOfMonth} of {daysInMonth}
                  </span>
                  <span>{monthPct}% of month</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${monthPct}%` }} />
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-primary-foreground/70">Month so far</p>
                    {isLoading ? <Skeleton className="mt-1 h-5 w-20 bg-white/20" /> : <p className="text-lg font-bold tabular-nums leading-tight">{formatMoney(metrics.monthSale)}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-primary-foreground/70">On track for</p>
                    {isLoading ? <Skeleton className="mt-1 h-5 w-20 bg-white/20" /> : <p className="text-lg font-bold tabular-nums leading-tight">{formatMoney(metrics.projectedSale, true)}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          {...enter(1)}
          icon={IndianRupee}
          accent="emerald"
          label="Sales this month"
          value={isLoading ? undefined : formatMoney(metrics.monthSale)}
          delta={isLoading ? undefined : trendPct(metrics.todaySale, metrics.avgDaySale)}
          progress={percentOf(metrics.todaySale, metrics.monthSale)}
          progressLabel={`Today ${formatMoney(metrics.todaySale)} · ${percentOf(metrics.todaySale, metrics.monthSale)}% of month`}
          href="/admin/orders"
        />
        <KpiTile
          {...enter(2)}
          icon={ShoppingBag}
          accent="sky"
          label="Orders this month"
          value={isLoading ? undefined : formatCount(metrics.monthOrders)}
          delta={isLoading ? undefined : trendPct(metrics.todayOrders, metrics.avgDayOrders)}
          progress={percentOf(metrics.todayOrders, metrics.monthOrders)}
          progressLabel={`${formatCount(metrics.todayOrders)} today · about ${metrics.avgDayOrders.toFixed(1)} per day`}
          href="/admin/orders"
        />
        <KpiTile
          {...enter(3)}
          icon={Truck}
          accent="amber"
          label="Purchases this month"
          value={isLoading ? undefined : formatMoney(metrics.monthPurchase)}
          delta={isLoading ? undefined : trendPct(metrics.todayPurchase, metrics.avgDayPurchase)}
          deltaInverted
          progress={percentOf(metrics.todayPurchase, metrics.monthPurchase)}
          progressLabel={`Today ${formatMoney(metrics.todayPurchase)} spent on stock`}
          href="/admin/purchase"
        />
        <KpiTile
          {...enter(4)}
          icon={Wallet}
          accent={metrics.netMonth >= 0 ? 'violet' : 'rose'}
          label="Net this month"
          value={isLoading ? undefined : `${metrics.netMonth < 0 ? '−' : ''}${formatMoney(Math.abs(metrics.netMonth))}`}
          progress={metrics.monthSale > 0 ? percentOf(Math.max(0, metrics.netMonth), metrics.monthSale) : 0}
          progressLabel={metrics.monthSale > 0 ? `${percentOf(Math.max(0, metrics.netMonth), metrics.monthSale)}% of sales kept after purchases` : 'No sales yet this month'}
          href="/admin/orders"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel {...enter(5)} title="Sales vs purchases" icon={IndianRupee} hint="Money in against money out, today and month to date.">
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
                format={(v) => formatMoney(v)}
                rows={[
                  { label: 'Today', a: metrics.todaySale, b: metrics.todayPurchase },
                  { label: 'This month', a: metrics.monthSale, b: metrics.monthPurchase },
                ]}
              />
            )}
          </Panel>

          <Panel {...enter(6)} title="Latest activity" icon={ShoppingBag} hint="Sales and stock purchases, newest first." href="/admin/orders" cta="All orders">
            <ActivityFeed limit={8} />
          </Panel>

          <Panel {...enter(7)} title="People" icon={Users} hint="Newest customers and the team on the books." href="/admin/users" cta="All users">
            <PeoplePanel summary={summary} loading={isLoading} />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel {...enter(5)} title="Products by category" icon={FolderTree} href="/admin/products" cta="Products">
            <CategoryBreakdown summary={summary} loading={isLoading} />
          </Panel>

          <Panel
            {...enter(6)}
            title="Stock watch"
            icon={AlertTriangle}
            count={lowStockQuery.isLoading ? undefined : lowStock.length}
            hint={isLoading ? undefined : `${formatCount(stockUnits)} units on hand across recent products.`}
            href="/admin/stock-purchase"
            cta="Receive stock"
          >
            {lowStockQuery.isLoading ? (
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
            ) : lowStock.length === 0 ? (
              <EmptyLine icon={Boxes} text="Everything is above its low-stock threshold." tone="good" />
            ) : (
              <ul className="space-y-3">
                {lowStock.map((product) => {
                  const threshold = product.lowStockThreshold || 5;
                  const ratio = Math.min(100, Math.round((product.stock / threshold) * 100));
                  const critical = product.stock === 0;
                  return (
                    <li key={product.id}>
                      <Link href={`/admin/products?search=${encodeURIComponent(product.name)}`} className="group flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Boxes className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate font-medium group-hover:underline">{product.name}</span>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums',
                                critical ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-700'
                              )}
                            >
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
            )}
          </Panel>

          <Panel {...enter(7)} title="Catalog" icon={Boxes} hint="What the store is built from.">
            <ul className="grid grid-cols-2 gap-2">
              <CatalogRow icon={Boxes} accent="sky" label="Products" value={summary?.productTotal} recent={summary?.products?.length} href="/admin/products" loading={isLoading} />
              <CatalogRow icon={FolderTree} accent="emerald" label="Categories" value={summary?.categoryTotal} recent={summary?.categories?.length} href="/admin/categories" loading={isLoading} />
              <CatalogRow icon={Tag} accent="violet" label="Brands" value={summary?.brandTotal} recent={summary?.brands?.length} href="/admin/brand-names" loading={isLoading} />
              <CatalogRow icon={Ruler} accent="amber" label="Attributes" value={summary?.attributeTotal} recent={summary?.attributes?.length} href="/admin/master-attributes" loading={isLoading} />
              <CatalogRow icon={Users} accent="rose" label="Customers" value={summary?.customerTotal} recent={summary?.customers?.length} href="/admin/users" loading={isLoading} />
              <CatalogRow icon={Briefcase} accent="indigo" label="Staff" value={summary?.staffTotal} recent={summary?.staff?.length} href="/admin/users" loading={isLoading} />
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

/* ---------- helpers ---------- */

// Percent change of today against the month's typical day. `null` when there is no baseline.
function trendPct(today: number, typical: number): number | null {
  if (typical <= 0) return today > 0 ? 100 : null;
  return Math.round(((today - typical) / typical) * 100);
}

// Percent change rendered as a pill; `inverted` flips the colouring for spend, where a rise is not good news.
function TrendChip({ delta, inverted = false, label, onDark = false }: { delta: number | null | undefined; inverted?: boolean; label?: string; onDark?: boolean }) {
  if (delta === undefined) return <Skeleton className={cn('h-4 w-16', onDark && 'bg-white/20')} />;
  if (delta === null) return <span className={cn('text-[11px]', onDark ? 'text-primary-foreground/70' : 'text-muted-foreground')}>No baseline yet</span>;
  const up = delta > 0;
  const flat = delta === 0;
  const good = flat ? null : inverted ? !up : up;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
        onDark
          ? 'bg-white/15 text-primary-foreground'
          : good === null
            ? 'bg-muted text-muted-foreground'
            : good
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
      )}
    >
      <Icon className="h-3 w-3" />
      {up ? '+' : ''}
      {delta}%{label ? <span className={cn('font-normal', onDark ? 'text-primary-foreground/70' : 'text-muted-foreground')}> {label}</span> : null}
    </span>
  );
}

function HeroStat({ label, value, delta, deltaLabel }: { label: string; value?: string; delta?: number | null; deltaLabel?: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-wide text-primary-foreground/70">{label}</p>
      {value === undefined ? <Skeleton className="mt-1 h-7 w-24 bg-white/20" /> : <p className="mt-0.5 text-2xl font-bold tabular-nums leading-tight">{value}</p>}
      <div className="mt-1.5">
        <TrendChip delta={delta} label={deltaLabel} onDark />
      </div>
    </div>
  );
}

const ACCENT: Record<string, { icon: string; bar: string; ring: string }> = {
  emerald: { icon: 'bg-emerald-50 text-emerald-600', bar: '[&>div]:bg-emerald-500', ring: 'from-emerald-500/15' },
  sky: { icon: 'bg-sky-50 text-sky-600', bar: '[&>div]:bg-sky-500', ring: 'from-sky-500/15' },
  amber: { icon: 'bg-amber-50 text-amber-600', bar: '[&>div]:bg-amber-500', ring: 'from-amber-500/15' },
  violet: { icon: 'bg-violet-50 text-violet-600', bar: '[&>div]:bg-violet-500', ring: 'from-violet-500/15' },
  rose: { icon: 'bg-rose-50 text-rose-600', bar: '[&>div]:bg-rose-500', ring: 'from-rose-500/15' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600', bar: '[&>div]:bg-indigo-500', ring: 'from-indigo-500/15' },
};

interface KpiTileProps {
  icon: React.ElementType;
  accent: keyof typeof ACCENT;
  label: string;
  value?: string;
  delta?: number | null;
  deltaInverted?: boolean;
  progress: number;
  progressLabel: string;
  href: string;
  className?: string;
  style?: React.CSSProperties;
}

function KpiTile({ icon: Icon, accent, label, value, delta, deltaInverted, progress, progressLabel, href, className, style }: KpiTileProps) {
  const a = ACCENT[accent];
  return (
    <Link href={href} className={cn('group block focus-visible:outline-none', className)} style={style}>
      <Card className="relative h-full overflow-hidden border p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring md:p-4">
        <div className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent', a.ring)} aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {value === undefined ? <Skeleton className="mt-1.5 h-7 w-28" /> : <p className="mt-1 truncate text-2xl font-bold tabular-nums leading-tight">{value}</p>}
          </div>
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', a.icon)}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {delta !== undefined && (
          <div className="relative mt-2">
            <TrendChip delta={delta} inverted={deltaInverted} label="vs typical day" />
          </div>
        )}
        <Progress value={progress} className={cn('mt-3 h-1.5', a.bar)} />
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{progressLabel}</p>
      </Card>
    </Link>
  );
}

interface PanelProps {
  title: string;
  icon: React.ElementType;
  hint?: string;
  count?: number;
  href?: string;
  cta?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function Panel({ title, icon: Icon, hint, count, href, cta, children, className, style }: PanelProps) {
  return (
    <Card className={cn('border p-0 md:p-0', className)} style={style}>
      <div className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold leading-tight">
              {title}
              {count !== undefined && <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{count}</span>}
            </h2>
            {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
          </div>
        </div>
        {href && cta && (
          <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
            {cta}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </Card>
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
        <Skeleton className="h-36 w-36 rounded-full" />
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
      <div className="inline-flex rounded-md border bg-muted/40 p-0.5 text-[11px]" role="radiogroup" aria-label="Measure">
        {(['count', 'stock'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn('rounded px-2 py-0.5 font-medium capitalize transition-colors', mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            {m === 'count' ? 'Products' : 'Units in stock'}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <DonutChart
          slices={slices.map((s) => ({ ...s, color: active && s.label !== active ? `${s.color}55` : s.color }))}
          size={144}
          thickness={16}
          centerLabel={formatCount(shown ? shown.value : total)}
          centerSub={shown ? `${percentOf(shown.value, total)}% · ${shown.label}` : mode === 'count' ? 'products' : 'units'}
        />
        <ul className="w-full flex-1 space-y-0.5 text-xs" onMouseLeave={() => setActive(null)}>
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
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3.5 flex-1" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <PeopleList
        title="New customers"
        emptyText="No customers yet."
        people={customers.map((c) => ({ id: c.id, name: c.name, sub: c.email, when: c.createdAt, active: c.isActive }))}
      />
      <PeopleList
        title="Team"
        emptyText="No staff added yet."
        people={staff.map((s) => ({
          id: s.id,
          name: s.user?.name || `Staff #${s.id}`,
          sub: [s.position, s.department].filter(Boolean).join(' · ') || s.user?.email || '',
          when: s.createdAt,
          active: s.isActive,
        }))}
      />
    </div>
  );
}

function PeopleList({ title, emptyText, people }: { title: string; emptyText: string; people: { id: number; name: string; sub: string; when: string; active: boolean }[] }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {people.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-2.5 rounded-md px-1 py-1">
              <Avatar name={p.name} active={p.active} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{p.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{p.sub || '—'}</p>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">{p.when ? formatDistanceToNow(new Date(p.when), { addSuffix: true }) : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const AVATAR_TONES = ['bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700', 'bg-indigo-100 text-indigo-700'];

function Avatar({ name, active }: { name: string; active: boolean }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const tone = AVATAR_TONES[name.length % AVATAR_TONES.length];
  return (
    <span className="relative shrink-0">
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold', tone)}>{initials || '?'}</span>
      <span className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background', active ? 'bg-emerald-500' : 'bg-zinc-400')} title={active ? 'Active' : 'Inactive'} />
    </span>
  );
}

function CatalogRow({
  icon: Icon,
  accent,
  label,
  value,
  recent,
  href,
  loading,
}: {
  icon: React.ElementType;
  accent: keyof typeof ACCENT;
  label: string;
  value?: number;
  recent?: number;
  href: string;
  loading: boolean;
}) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', ACCENT[accent].icon)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-0.5 h-4 w-10" />
          ) : (
            <p className="flex items-baseline gap-1.5 text-sm font-semibold tabular-nums leading-tight">
              {formatCount(value ?? 0)}
              {!!recent && <span className="text-[10px] font-medium text-emerald-600">+{recent} recent</span>}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function EmptyLine({ icon: Icon, text, tone = 'muted' }: { icon: React.ElementType; text: string; tone?: 'muted' | 'good' }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg px-3 py-3 text-xs', tone === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-muted/50 text-muted-foreground')}>
      <Icon className="h-4 w-4 shrink-0" />
      {text}
    </div>
  );
}
