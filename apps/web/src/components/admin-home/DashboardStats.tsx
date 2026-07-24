import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { IndianRupee, Package, ShoppingBag, ShoppingCart, Tags, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type Accent = 'emerald' | 'violet' | 'blue' | 'teal' | 'amber' | 'sky' | 'indigo' | 'rose';

const ACCENTS: Record<Accent, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

type StatCardProps = {
  icon: React.ElementType;
  title: string;
  total: number;
  recentCount?: number;
  trend?: number;
  accent: Accent;
  href: string;
  isCurrency?: boolean;
};

const StatCard = ({ icon: Icon, title, total, recentCount, trend, accent, href, isCurrency }: StatCardProps) => {
  const formatted = isCurrency
    ? `₹${(total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : (total ?? 0).toLocaleString();

  return (
    <Link href={href} className="group block h-full">
      <Card className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-none transition-colors duration-200 hover:border-border">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', ACCENTS[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{formatted}</div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            {trend !== undefined ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-semibold',
                  trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
            ) : recentCount !== undefined ? (
              <span>
                <span className="font-semibold text-foreground">{recentCount}</span> new recently
              </span>
            ) : (
              <span>Live</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

interface DashboardStatsProps {
  summaryData: any;
}

export default function DashboardStats({ summaryData }: DashboardStatsProps) {
  if (!summaryData) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Sales */}
      <StatCard icon={IndianRupee} title="Today's Sale" total={summaryData.todaySale || 0} isCurrency accent="emerald" href="/admin/orders" />
      <StatCard icon={IndianRupee} title="Month Sale" total={summaryData.totalMonthSale || 0} isCurrency accent="violet" href="/admin/orders" />

      {/* Purchases */}
      <StatCard icon={ShoppingCart} title="Today's Purchase" total={summaryData.todayPurchase || 0} isCurrency accent="amber" href="/admin/purchase" />
      <StatCard icon={ShoppingCart} title="Month Purchase" total={summaryData.totalMonthPurchase || 0} isCurrency accent="sky" href="/admin/purchase" />

      {/* Orders */}
      <StatCard icon={ShoppingBag} title="Today's Orders" total={summaryData.todayOrderCount || 0} accent="blue" href="/admin/orders" />
      <StatCard icon={ShoppingBag} title="Month Orders" total={summaryData.totalMonthOrderCount || 0} accent="indigo" href="/admin/orders" />

      {/* Catalog */}
      <StatCard
        icon={Package}
        title="Total Products"
        total={summaryData.productTotal || 0}
        recentCount={summaryData.products?.length || 0}
        accent="teal"
        href="/admin/products"
      />
      <StatCard
        icon={Tags}
        title="Total Attributes"
        total={summaryData.attributeTotal || 0}
        recentCount={summaryData.attributes?.length || 0}
        accent="rose"
        href="/admin/attributes"
      />
    </div>
  );
}
