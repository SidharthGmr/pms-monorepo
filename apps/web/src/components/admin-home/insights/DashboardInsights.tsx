'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Briefcase,
  CalendarDays,
  FolderTree,
  IndianRupee,
  PackagePlus,
  Plus,
  Ruler,
  ShoppingBag,
  Tag,
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
  stock: number;
  lowStockThreshold?: number | null;
  images?: string[];
}

const greetingFor = (hour: number) => (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

const QUICK_ACTIONS = [
  { label: 'New sale', href: '/admin/pos', icon: ShoppingBag },
  { label: 'Add product', href: '/admin/products', icon: PackagePlus },
  { label: 'Receive stock', href: '/admin/receive-stock', icon: Truck },
  { label: 'Add category', href: '/admin/categories', icon: Plus },
];

export default function DashboardInsights() {
  const { currentUser } = useGetCurrentUser();
  const summaryQuery = useGetDashboardSummary();
  const lowStockQuery = useGetLowStockProducts();

  const summary: DashboardSummaryDto | undefined = summaryQuery.data?.data?.data;
  const lowStock = ((lowStockQuery.data?.data?.data?.data as LowStockProduct[] | undefined) ?? []).slice(0, 5);

  const today = new Date();
  const dayOfMonth = today.getDate();

  // Month figures divided by the days elapsed give a "typical day" to hold today up against.
  const metrics = useMemo(() => {
    const s = summary;
    const monthSale = s?.totalMonthSale ?? 0;
    const monthPurchase = s?.totalMonthPurchase ?? 0;
    const monthOrders = s?.totalMonthOrderCount ?? 0;
    return {
      todaySale: s?.todaySale ?? 0,
      monthSale,
      avgDaySale: monthSale / Math.max(1, dayOfMonth),
      todayPurchase: s?.todayPurchase ?? 0,
      monthPurchase,
      todayOrders: s?.todayOrderCount ?? 0,
      monthOrders,
      avgDayOrders: monthOrders / Math.max(1, dayOfMonth),
      netToday: (s?.todaySale ?? 0) - (s?.todayPurchase ?? 0),
      netMonth: monthSale - monthPurchase,
    };
  }, [summary, dayOfMonth]);

  const distribution = useMemo(() => {
    const rows = [...(summary?.productDistribution ?? [])].sort((a, b) => b.count - a.count);
    const top = rows.slice(0, 6);
    const rest = rows.slice(6);
    const slices = top.map((r, i) => ({ label: r.name, value: r.count, color: CHART_COLORS[i % CHART_COLORS.length] }));
    if (rest.length) slices.push({ label: `Other (${rest.length})`, value: rest.reduce((n, r) => n + r.count, 0), color: '#94a3b8' });
    return slices;
  }, [summary]);

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

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-indigo-700 px-6 py-6 text-primary-foreground shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/80">
              <CalendarDays className="h-3.5 w-3.5" />
              {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {greetingFor(today.getHours())}
              {currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}
            </h1>
            <p className="max-w-md text-sm text-primary-foreground/85">
              {isLoading ? (
                <Skeleton className="h-4 w-64 bg-white/20" />
              ) : metrics.todayOrders > 0 ? (
                <>
                  {formatCount(metrics.todayOrders)} {metrics.todayOrders === 1 ? 'order' : 'orders'} so far today, worth {formatMoney(metrics.todaySale)}.{' '}
                  {metrics.todaySale >= metrics.avgDaySale ? 'Ahead of a typical day this month.' : 'Behind a typical day this month so far.'}
                </>
              ) : (
                'No orders yet today. Start a sale or check what is running low.'
              )}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
                <Button key={href} asChild size="sm" variant="white" className="h-8 gap-1.5 bg-white/15 text-primary-foreground hover:bg-white hover:text-primary">
                  <Link href={href}>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto">
            <HeroStat label="Sales today" value={isLoading ? undefined : formatMoney(metrics.todaySale)} sub={`Month ${formatMoney(metrics.monthSale, true)}`} />
            <HeroStat label="Orders today" value={isLoading ? undefined : formatCount(metrics.todayOrders)} sub={`Month ${formatCount(metrics.monthOrders)}`} />
            <HeroStat
              label="Net today"
              value={isLoading ? undefined : `${metrics.netToday < 0 ? '−' : ''}${formatMoney(Math.abs(metrics.netToday))}`}
              sub="Sales minus purchases"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </section>

      {/* KPI tiles */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon={IndianRupee}
          accent="emerald"
          label="Sales this month"
          value={isLoading ? undefined : formatMoney(metrics.monthSale)}
          progress={percentOf(metrics.todaySale, metrics.monthSale)}
          progressLabel={`Today is ${percentOf(metrics.todaySale, metrics.monthSale)}% of the month`}
          href="/admin/orders"
        />
        <KpiTile
          icon={ShoppingBag}
          accent="sky"
          label="Orders this month"
          value={isLoading ? undefined : formatCount(metrics.monthOrders)}
          progress={percentOf(metrics.todayOrders, metrics.monthOrders)}
          progressLabel={`${formatCount(metrics.todayOrders)} today · ~${metrics.avgDayOrders.toFixed(1)} per day`}
          href="/admin/orders"
        />
        <KpiTile
          icon={Truck}
          accent="amber"
          label="Purchases this month"
          value={isLoading ? undefined : formatMoney(metrics.monthPurchase)}
          progress={percentOf(metrics.todayPurchase, metrics.monthPurchase)}
          progressLabel={`${formatMoney(metrics.todayPurchase)} today`}
          href="/admin/purchase"
        />
        <KpiTile
          icon={Wallet}
          accent={metrics.netMonth >= 0 ? 'violet' : 'rose'}
          label="Net this month"
          value={isLoading ? undefined : `${metrics.netMonth < 0 ? '−' : ''}${formatMoney(Math.abs(metrics.netMonth))}`}
          progress={metrics.monthSale > 0 ? percentOf(Math.max(0, metrics.netMonth), metrics.monthSale) : 0}
          progressLabel={metrics.monthSale > 0 ? `${percentOf(Math.max(0, metrics.netMonth), metrics.monthSale)}% of sales kept` : 'No sales yet this month'}
          href="/admin/orders"
        />
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel title="Sales vs purchases" icon={IndianRupee} hint="Money in against money out, today and month to date.">
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

          <Panel title="Latest activity" icon={ShoppingBag} hint="Sales and stock purchases, newest first." href="/admin/orders" cta="All orders">
            <ActivityFeed limit={8} />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Products by category" icon={FolderTree} href="/admin/products" cta="Products">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-36 w-36 rounded-full" />
                <div className="flex-1 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-full" />
                  ))}
                </div>
              </div>
            ) : distribution.length === 0 ? (
              <EmptyLine icon={Boxes} text="Add products and they will be grouped here by category." />
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <DonutChart slices={distribution} size={144} thickness={16} centerLabel={formatCount(summary?.productTotal ?? 0)} centerSub="products" />
                <ul className="w-full flex-1 space-y-1.5 text-xs">
                  {distribution.map((slice) => (
                    <li key={slice.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: slice.color }} />
                      <span className="min-w-0 flex-1 truncate">{slice.label}</span>
                      <span className="tabular-nums text-muted-foreground">{slice.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel
            title="Stock watch"
            icon={AlertTriangle}
            count={lowStockQuery.isLoading ? undefined : lowStock.length}
            hint={isLoading ? undefined : `${formatCount(stockUnits)} units on hand across recent products.`}
            href="/admin/products"
            cta="Products"
          >
            {lowStockQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-2 w-full" />
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
                      <Link href={`/admin/products?search=${encodeURIComponent(product.name)}`} className="group block">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate font-medium group-hover:underline">{product.name}</span>
                          <span className={cn('shrink-0 tabular-nums', critical ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                            {product.stock} / {threshold}
                          </span>
                        </div>
                        <Progress value={ratio} className={cn('mt-1.5 h-1.5', critical ? '[&>div]:bg-destructive' : '[&>div]:bg-amber-500')} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Catalog" icon={Boxes} hint="What the store is built from.">
            <ul className="grid grid-cols-2 gap-2">
              <CatalogRow icon={Boxes} label="Products" value={summary?.productTotal} href="/admin/products" loading={isLoading} />
              <CatalogRow icon={FolderTree} label="Categories" value={summary?.categoryTotal} href="/admin/categories" loading={isLoading} />
              <CatalogRow icon={Tag} label="Brands" value={summary?.brandTotal} href="/admin/brand-names" loading={isLoading} />
              <CatalogRow icon={Ruler} label="Attributes" value={summary?.attributeTotal} href="/admin/master-attributes" loading={isLoading} />
              <CatalogRow icon={Users} label="Customers" value={summary?.customerTotal} href="/admin/users" loading={isLoading} />
              <CatalogRow icon={Briefcase} label="Staff" value={summary?.staffTotal} href="/admin/staff" loading={isLoading} />
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

/* ---------- building blocks ---------- */

function HeroStat({ label, value, sub, className }: { label: string; value?: string; sub?: string; className?: string }) {
  return (
    <div className={cn('rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm', className)}>
      <p className="text-[11px] uppercase tracking-wide text-primary-foreground/70">{label}</p>
      {value === undefined ? <Skeleton className="mt-1 h-7 w-24 bg-white/20" /> : <p className="mt-0.5 text-xl font-bold tabular-nums leading-tight">{value}</p>}
      {sub && <p className="mt-0.5 text-[11px] text-primary-foreground/70">{sub}</p>}
    </div>
  );
}

const ACCENT: Record<string, { icon: string; bar: string }> = {
  emerald: { icon: 'bg-emerald-50 text-emerald-600', bar: '[&>div]:bg-emerald-500' },
  sky: { icon: 'bg-sky-50 text-sky-600', bar: '[&>div]:bg-sky-500' },
  amber: { icon: 'bg-amber-50 text-amber-600', bar: '[&>div]:bg-amber-500' },
  violet: { icon: 'bg-violet-50 text-violet-600', bar: '[&>div]:bg-violet-500' },
  rose: { icon: 'bg-rose-50 text-rose-600', bar: '[&>div]:bg-rose-500' },
};

function KpiTile({
  icon: Icon,
  accent,
  label,
  value,
  progress,
  progressLabel,
  href,
}: {
  icon: React.ElementType;
  accent: keyof typeof ACCENT;
  label: string;
  value?: string;
  progress: number;
  progressLabel: string;
  href: string;
}) {
  const a = ACCENT[accent];
  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Card className="h-full border p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring md:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {value === undefined ? <Skeleton className="mt-1.5 h-7 w-28" /> : <p className="mt-1 truncate text-2xl font-bold tabular-nums leading-tight">{value}</p>}
          </div>
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', a.icon)}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <Progress value={progress} className={cn('mt-3 h-1.5', a.bar)} />
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{progressLabel}</p>
      </Card>
    </Link>
  );
}

function Panel({
  title,
  icon: Icon,
  hint,
  count,
  href,
  cta,
  children,
}: {
  title: string;
  icon: React.ElementType;
  hint?: string;
  count?: number;
  href?: string;
  cta?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border p-0 md:p-0">
      <div className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
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
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
            {cta}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </Card>
  );
}

function CatalogRow({ icon: Icon, label, value, href, loading }: { icon: React.ElementType; label: string; value?: number; href: string; loading: boolean }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/40">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-0.5 h-4 w-10" /> : <p className="text-sm font-semibold tabular-nums leading-tight">{formatCount(value ?? 0)}</p>}
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
