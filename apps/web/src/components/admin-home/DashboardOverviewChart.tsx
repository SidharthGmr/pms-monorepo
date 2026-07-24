'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardSummaryDto } from '@/dtos/dashboard-summary.dto';
import { cn } from '@/lib/utils';
import { PieChart } from 'lucide-react';
import { useState } from 'react';

const money = (n: number) => `₹${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Period = 'today' | 'month';

export default function DashboardOverviewChart({ data }: { data?: DashboardSummaryDto }) {
  const [period, setPeriod] = useState<Period>('today');

  const sale = period === 'today' ? data?.todaySale ?? 0 : data?.totalMonthSale ?? 0;
  const purchase = period === 'today' ? data?.todayPurchase ?? 0 : data?.totalMonthPurchase ?? 0;
  const orders = period === 'today' ? data?.todayOrderCount ?? 0 : data?.totalMonthOrderCount ?? 0;
  const net = sale - purchase;

  const max = Math.max(sale, purchase, 1);
  const total = sale + purchase;
  const salePct = total > 0 ? (sale / total) * 100 : 0;
  const purchasePct = total > 0 ? (purchase / total) * 100 : 0;

  // Donut geometry (SVG, dependency-free).
  const R = 54;
  const C = 2 * Math.PI * R;
  const saleLen = (salePct / 100) * C;
  const purchaseLen = (purchasePct / 100) * C;

  const bars = [
    { label: 'Sales', value: sale, bar: 'bg-emerald-500', pct: (sale / max) * 100 },
    { label: 'Purchases', value: purchase, bar: 'bg-amber-500', pct: (purchase / max) * 100 },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
            <PieChart className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Sales vs Purchases</h3>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-8 p-5 md:grid-cols-2">
        {/* Bars + summary */}
        <div className="flex flex-col justify-center gap-4">
          {bars.map((b) => (
            <div key={b.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={cn('h-2 w-2 rounded-full', b.bar)} />
                  {b.label}
                </span>
                <span className="font-semibold text-foreground">{money(b.value)}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all duration-500', b.bar)} style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}

          <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
            <span className="text-muted-foreground">Net {net >= 0 ? '(profit)' : '(loss)'}</span>
            <span className={cn('font-bold', net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {money(net)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Orders</span>
            <span className="font-semibold text-foreground">{orders.toLocaleString()}</span>
          </div>
        </div>

        {/* Donut */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative h-[150px] w-[150px]">
            <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-90">
              <circle cx="75" cy="75" r={R} fill="none" strokeWidth="16" className="stroke-muted" />
              {total > 0 && (
                <>
                  <circle
                    cx="75"
                    cy="75"
                    r={R}
                    fill="none"
                    strokeWidth="16"
                    className="stroke-emerald-500"
                    strokeDasharray={`${saleLen} ${C - saleLen}`}
                  />
                  <circle
                    cx="75"
                    cy="75"
                    r={R}
                    fill="none"
                    strokeWidth="16"
                    className="stroke-amber-500"
                    strokeDasharray={`${purchaseLen} ${C - purchaseLen}`}
                    strokeDashoffset={-saleLen}
                  />
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
              <span className="text-sm font-bold text-foreground">{money(total)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sales {salePct.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Purchases {purchasePct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
