'use client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardSummaryDto } from '@/dtos/dashboard-summary.dto';
import { useGetDashboardSummary } from '@/hooks/service-hooks/useDashboardService';
import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { useGetLowStockProducts } from '@/hooks/service-hooks/useProductService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FolderTree,
  IndianRupee,
  Plus,
  ShoppingBag,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import FocusActivityFeed from './FocusActivityFeed';
import { formatCount, formatMoney } from './format';
import FocusSalesTrend from './FocusSalesTrend';
import { Accent, ACCENT, EmptyLine, Panel, SURFACE, TrendChip, trendPct } from './widgets';

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
const enter = (step: number) => ({
  className: 'animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500',
  style: { animationDelay: `${step * 60}ms` },
});

interface DashboardFocusProps {
  /** Rendered beside the page actions, e.g. the Insights / Classic switch. */
  toolbar?: ReactNode;
}

/**
 * Four regions, in the order the question gets asked: what needs doing, how today went, where
 * the week is heading, and what the shop is made of. Every figure that is not actionable sits
 * below the ones that are.
 */
export default function DashboardFocus({ toolbar }: DashboardFocusProps) {
  const { currentUser } = useGetCurrentUser();
  const summaryQuery = useGetDashboardSummary();
  const lowStockQuery = useGetLowStockProducts();
  // Only the count is wanted, so one row is enough - the API still reports the full total.
  const pendingQuery = useGetAllOrders({ status: 'PENDING', recordPerPage: 1 });

  const summary: DashboardSummaryDto | undefined = summaryQuery.data?.data?.data;
  const lowStockAll = (lowStockQuery.data?.data?.data?.data as LowStockProduct[] | undefined) ?? [];
  const pendingOrders = pendingQuery.data?.data?.data?.totalRecord ?? 0;

  const outOfStock = lowStockAll.filter((product) => (product.stock ?? 0) <= 0);
  const runningLow = lowStockAll.filter((product) => (product.stock ?? 0) > 0);

  const today = new Date();
  const dayOfMonth = today.getDate();

  // Month figures divided by the days elapsed give a "typical day" to hold today up against.
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
      netMonth: monthSale - monthPurchase,
    };
  }, [summary, dayOfMonth]);

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
  const firstName = currentUser?.name?.trim().split(' ')[0];

  const tasks = [
    outOfStock.length > 0 && {
      key: 'out',
      tone: 'critical' as const,
      icon: AlertTriangle,
      title: `${formatCount(outOfStock.length)} ${outOfStock.length === 1 ? 'product is' : 'products are'} out of stock`,
      body: outOfStock
        .slice(0, 3)
        .map((product) => product.name)
        .join(', '),
      cta: { label: 'Receive stock', href: '/admin/stock-purchase' },
    },
    pendingOrders > 0 && {
      key: 'pending',
      tone: 'warning' as const,
      icon: ClipboardList,
      title: `${formatCount(pendingOrders)} ${pendingOrders === 1 ? 'order is' : 'orders are'} waiting to be confirmed`,
      body: 'Confirm them so the stock and the invoice agree.',
      cta: { label: 'Review orders', href: '/admin/orders?status=PENDING' },
    },
    runningLow.length > 0 && {
      key: 'low',
      tone: 'warning' as const,
      icon: Boxes,
      title: `${formatCount(runningLow.length)} ${runningLow.length === 1 ? 'product is' : 'products are'} running low`,
      body: runningLow
        .slice(0, 3)
        .map((product) => `${product.name} (${product.stock})`)
        .join(', '),
      cta: { label: 'Check stock', href: '/admin/products' },
    },
  ].filter(Boolean) as {
    key: string;
    tone: 'critical' | 'warning';
    icon: React.ElementType;
    title: string;
    body: string;
    cta: { label: string; href: string };
  }[];

  const checking = lowStockQuery.isLoading || pendingQuery.isPending;

  return (
    <div className="space-y-5">
      {/* 1. Who, when, and how the day is going in one sentence. */}
      <section {...enter(0)} className={cn(enter(0).className, 'flex flex-col gap-3 md:flex-row md:items-end md:justify-between')}>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {greetingFor(today.getHours())}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-72" />
            ) : metrics.todayOrders > 0 ? (
              <>
                <strong className="font-semibold text-foreground">{formatCount(metrics.todayOrders)}</strong>{' '}
                {metrics.todayOrders === 1 ? 'order' : 'orders'} today worth{' '}
                <strong className="font-semibold text-foreground">{formatMoney(metrics.todaySale)}</strong> —{' '}
                {metrics.todaySale >= metrics.avgDaySale ? 'ahead of a typical day this month.' : 'behind a typical day this month.'}
              </>
            ) : (
              'No orders yet today. Start a sale, or see what needs attention below.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <Button asChild size="sm" variant="outline" className="h-9">
            <Link href="/admin/stock-purchase">
              <Truck className="h-4 w-4" />
              Receive stock
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9">
            <Link href="/admin/checkout">
              <Plus className="h-4 w-4" />
              New sale
            </Link>
          </Button>
        </div>
      </section>

      {/* 3. The numbers, all four read the same way: figure, change against a typical day, link. */}
      <section>
        <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Today · {today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FocusKpi
            {...enter(2)}
            icon={IndianRupee}
            accent="emerald"
            label="Sales today"
            amount={metrics.todaySale}
            value={isLoading ? undefined : formatMoney(metrics.todaySale)}
            delta={isLoading ? undefined : trendPct(metrics.todaySale, metrics.avgDaySale)}
            typical={`Typical day ${formatMoney(metrics.avgDaySale, true)}`}
            month={`${formatMoney(metrics.monthSale, true)} this month`}
            href="/admin/orders"
          />
          <FocusKpi
            {...enter(3)}
            icon={ShoppingBag}
            accent="sky"
            label="Orders today"
            amount={metrics.todayOrders}
            value={isLoading ? undefined : formatCount(metrics.todayOrders)}
            delta={isLoading ? undefined : trendPct(metrics.todayOrders, metrics.avgDayOrders)}
            typical={`Typical day ${metrics.avgDayOrders.toFixed(1)}`}
            month={`${formatCount(metrics.monthOrders)} this month`}
            href="/admin/orders"
          />
          <FocusKpi
            {...enter(4)}
            icon={Truck}
            accent="amber"
            label="Stock bought today"
            amount={metrics.todayPurchase}
            value={isLoading ? undefined : formatMoney(metrics.todayPurchase)}
            delta={isLoading ? undefined : trendPct(metrics.todayPurchase, metrics.avgDayPurchase)}
            deltaInverted
            typical={`Typical day ${formatMoney(metrics.avgDayPurchase, true)}`}
            month={`${formatMoney(metrics.monthPurchase, true)} this month`}
            href="/admin/stock-purchase/history"
          />
          <FocusKpi
            {...enter(5)}
            icon={Wallet}
            accent={metrics.netMonth >= 0 ? 'violet' : 'rose'}
            label="Net this month"
            amount={metrics.netMonth}
            value={isLoading ? undefined : `${metrics.netMonth < 0 ? '−' : ''}${formatMoney(Math.abs(metrics.netMonth))}`}
            typical={`${formatMoney(metrics.monthSale, true)} in`}
            month={`${formatMoney(metrics.monthPurchase, true)} out`}
            href="/admin/orders"
          />
        </div>
      </section>

      {/* 4. Context: where the week is going, what just happened, what is thin on the shelf. */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <Panel
            {...enter(6)}
            title="Sales, last 7 days"
            icon={TrendingUp}
            hint="Completed orders by day; cancelled and returned are left out."
            href="/admin/orders"
            cta="All orders"
          >
            <FocusSalesTrend days={7} />
          </Panel>

          <Panel
            {...enter(7)}
            title="Latest activity"
            icon={ShoppingBag}
            hint="Sales and stock purchases, newest first, grouped by day."
            href="/admin/orders"
            cta="All orders"
          >
            <FocusActivityFeed limit={6} />
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel
            {...enter(6)}
            title="Low on stock"
            icon={AlertTriangle}
            count={lowStockQuery.isLoading ? undefined : lowStockAll.length}
            href="/admin/stock-purchase"
            cta="Receive stock"
          >
            <StockWatch items={lowStockAll} loading={lowStockQuery.isLoading} />
          </Panel>

          <Panel {...enter(7)} title="What the shop holds" icon={Boxes} bodyClassName="px-3 py-3 sm:px-3">
            <ul className="grid grid-cols-2 gap-2">
              <CatalogRow icon={Boxes} accent="sky" label="Products" value={summary?.productTotal} href="/admin/products" loading={isLoading} />
              <CatalogRow
                icon={FolderTree}
                accent="emerald"
                label="Categories"
                value={summary?.categoryTotal}
                href="/admin/categories"
                loading={isLoading}
              />
              <CatalogRow icon={Tag} accent="violet" label="Brands" value={summary?.brandTotal} href="/admin/brand-names" loading={isLoading} />
              <CatalogRow icon={Users} accent="rose" label="Customers" value={summary?.customerTotal} href="/admin/users" loading={isLoading} />
            </ul>
          </Panel>

          {/* 2. The only part of the page that asks for a decision, so it comes before the figures. */}
          <section {...enter(1)}>
            <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Needs attention
              {!checking && tasks.length > 0 && (
                <span className="rounded-full bg-destructive/10 px-1.5 text-[10px] tabular-nums text-destructive">{tasks.length}</span>
              )}
            </h2>

            {checking ? (
              <div className="grid gap-3 lg:grid-cols-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-[4.5rem] rounded-xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className={cn(SURFACE, 'flex items-center gap-3 px-4 py-3.5')}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Nothing needs you right now</p>
                  <p className="text-xs text-muted-foreground">Every product is above its threshold and no order is waiting.</p>
                </div>
              </div>
            ) : (
              <ul className="grid gap-3 lg:grid-cols-1">
                {tasks.map((task) => (
                  <li key={task.key}>
                    <Link
                      href={task.cta.href}
                      className={cn(
                        'group flex h-full items-start gap-3 rounded-xl border px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md',
                        task.tone === 'critical' ? 'border-destructive/30 bg-destructive/[0.04]' : 'border-amber-500/30 bg-amber-500/[0.05]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          task.tone === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        )}
                      >
                        <task.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{task.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.body}</p>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          {task.cta.label}
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

/**
 * A figure card that only states things that can be read. The space a progress bar would take is
 * given instead to the two numbers the figure is actually judged against - a typical day, and the
 * month to date.
 */
function FocusKpi({
  icon: Icon,
  accent,
  label,
  amount,
  value,
  delta,
  deltaInverted,
  typical,
  month,
  href,
  className,
  style,
}: {
  icon: React.ElementType;
  accent: Accent;
  label: string;
  amount: number;
  value?: string;
  delta?: number | null;
  deltaInverted?: boolean;
  typical: string;
  month: string;
  href: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const a = ACCENT[accent];
  const loading = value === undefined;

  return (
    <Link
      href={href}
      className={cn('group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      style={style}
    >
      <div
        className={cn(
          SURFACE,
          'relative flex h-full flex-col overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md'
        )}
      >
        <div
          className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent', a.glow)}
          aria-hidden
        />

        <div className="relative flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate text-xs font-medium text-muted-foreground">{label}</p>
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', a.icon)}>
              <Icon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {loading ? <Skeleton className="h-8 w-28" /> : <p className="truncate text-2xl font-bold tabular-nums leading-none">{value}</p>}
            {/* A red -100% on a quiet morning reads as a problem; it is just an empty day so far. */}
            {!loading &&
              (amount > 0 ? (
                delta !== undefined && <TrendChip delta={delta} inverted={deltaInverted} />
              ) : (
                <span className="text-[11px] text-muted-foreground">nothing yet</span>
              ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-2 border-t border-border/70 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          {loading ? (
            <>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <span className="truncate">{typical}</span>
              <span className="shrink-0 truncate font-medium text-foreground/70">{month}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function StockWatch({ items, loading }: { items: LowStockProduct[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
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

  // The panel sits beside a taller column, so the list is capped at roughly four rows and the
  // rest scrolls - every low item stays reachable without the card growing down the page.
  return (
    <div className="-mr-3 max-h-[15rem] overflow-y-auto overscroll-contain pr-3 sm:max-h-[17rem]">
      <ul className="space-y-3">
        {items.map((product) => {
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
                        critical ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      )}
                    >
                      {critical ? 'Out' : `${product.stock} left`}
                    </span>
                  </div>
                  <Progress value={ratio} className={cn('mt-1.5 h-1.5', critical ? '[&>div]:bg-destructive' : '[&>div]:bg-amber-500')} />
                  <p className="mt-1 text-[10px] text-muted-foreground">Alerts below {threshold}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CatalogRow({
  icon: Icon,
  accent,
  label,
  value,
  href,
  loading,
}: {
  icon: React.ElementType;
  accent: Accent;
  label: string;
  value?: number;
  href: string;
  loading: boolean;
}) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="group flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
      >
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', ACCENT[accent].icon)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-0.5 h-4 w-10" />
          ) : (
            <p className="text-sm font-semibold tabular-nums leading-tight">{formatCount(value ?? 0)}</p>
          )}
        </div>
      </Link>
    </li>
  );
}
