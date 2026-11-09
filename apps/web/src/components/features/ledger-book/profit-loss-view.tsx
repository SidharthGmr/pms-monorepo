'use client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ProfitLossDto, ProfitLossLine } from '@pms/types';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface ProfitLossViewProps {
  report?: ProfitLossDto;
  loading?: boolean;
  error?: boolean;
}

function SectionRows({ heading, lines, total, totalLabel }: { heading: string; lines: ProfitLossLine[]; total: number; totalLabel: string }) {
  return (
    <>
      <TableRow className="bg-muted/20">
        <TableCell colSpan={2} className="pl-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </TableCell>
      </TableRow>
      {lines.map((line) => (
        <TableRow key={line.accountId}>
          <TableCell className="pl-8">
            <span className="text-sm">{line.name}</span>
            <span className="ml-2 text-[11px] text-muted-foreground">{line.code}</span>
          </TableCell>
          <TableCell className={cn('pr-5 text-right text-sm tabular-nums', line.amount < 0 && 'text-rose-600 dark:text-rose-400')}>
            {formatPrice(line.amount)}
          </TableCell>
        </TableRow>
      ))}
      {lines.length === 0 && (
        <TableRow>
          <TableCell colSpan={2} className="pl-8 text-xs text-muted-foreground">
            Nothing in this period.
          </TableCell>
        </TableRow>
      )}
      <TableRow className="font-semibold">
        <TableCell className="pl-5 text-sm">{totalLabel}</TableCell>
        <TableCell className="pr-5 text-right text-sm tabular-nums">{formatPrice(total)}</TableCell>
      </TableRow>
    </>
  );
}

export default function ProfitLossView({ report, loading, error }: ProfitLossViewProps) {
  if (error) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load the profit &amp; loss report</p>
      </Card>
    );
  }

  if (loading && !report) {
    return (
      <Card className="space-y-3 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (!report) return null;

  const profitable = report.netProfit >= 0;

  return (
    <Card className={cn('overflow-hidden p-0 md:p-0', loading && 'opacity-60 transition-opacity')}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
        <div>
          <h2 className="text-base font-bold">Profit &amp; Loss</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Income less expenses over the period, read from the journal. Purchases count as a direct cost when they post — unsold stock is not
            valued separately yet.
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'gap-1',
            profitable
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300'
          )}
        >
          {profitable ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {profitable ? `Profit ${formatPrice(report.netProfit)}` : `Loss ${formatPrice(Math.abs(report.netProfit))}`}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5 text-[11px] uppercase tracking-wider">Particulars</TableHead>
            <TableHead className="pr-5 text-right text-[11px] uppercase tracking-wider">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <SectionRows heading="Income" lines={report.income} total={report.incomeTotal} totalLabel="Total income" />
          {(report.directCosts.length > 0 || report.directCostTotal !== 0) && (
            <SectionRows heading="Direct costs" lines={report.directCosts} total={report.directCostTotal} totalLabel="Total direct costs" />
          )}
          <TableRow className="border-t bg-muted/30 font-semibold">
            <TableCell className="pl-5 text-sm">Gross profit</TableCell>
            <TableCell className={cn('pr-5 text-right text-sm tabular-nums', report.grossProfit < 0 && 'text-rose-600 dark:text-rose-400')}>
              {formatPrice(report.grossProfit)}
            </TableCell>
          </TableRow>
          <SectionRows heading="Expenses" lines={report.expenses} total={report.expenseTotal} totalLabel="Total expenses" />
          <TableRow className="border-t-2 bg-muted/30 text-base font-bold">
            <TableCell className="pl-5">{profitable ? 'Net profit' : 'Net loss'}</TableCell>
            <TableCell className={cn('pr-5 text-right tabular-nums', !profitable && 'text-rose-600 dark:text-rose-400')}>
              {formatPrice(Math.abs(report.netProfit))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}
