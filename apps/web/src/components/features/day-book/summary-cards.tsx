'use client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { DayBookSummaryDto } from '@pms/types';
import { ArrowDownLeft, ArrowUpRight, Info, Scale, Wallet } from 'lucide-react';

interface DayBookSummaryCardsProps {
  summary?: DayBookSummaryDto;
  loading?: boolean;
}

/**
 * Journal movement and cash flow are shown as two separate things on purpose. For a balanced
 * set of vouchers the debit and credit totals are equal by construction, so they say how much
 * was recorded, not how much money came in - reading one as the other is the classic way a day
 * book misleads. Only the cash figures, taken from cash and bank lines, are real movement.
 */
export default function DayBookSummaryCards({ summary, loading }: DayBookSummaryCardsProps) {
  if (loading && !summary) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Card key={key} size="sm" className="p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-6 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const tiles = [
    {
      label: 'Recorded (Dr)',
      value: summary.totalDebit,
      icon: Scale,
      tone: 'text-slate-600 dark:text-slate-300',
      hint: 'Total debits across every voucher shown. In balanced books this equals total credits, so it measures bookkeeping volume - not income and not cash.',
    },
    {
      label: 'Recorded (Cr)',
      value: summary.totalCredit,
      icon: Scale,
      tone: 'text-slate-600 dark:text-slate-300',
      hint: 'Total credits across every voucher shown. It should match total debits; a mismatch means something was posted out of balance.',
    },
    {
      label: 'Cash & bank in',
      value: summary.cashIn,
      icon: ArrowDownLeft,
      tone: 'text-emerald-600 dark:text-emerald-400',
      hint: 'Money that actually arrived, taken only from lines against cash and bank accounts.',
    },
    {
      label: 'Cash & bank out',
      value: summary.cashOut,
      icon: ArrowUpRight,
      tone: 'text-rose-600 dark:text-rose-400',
      hint: 'Money that actually left, taken only from lines against cash and bank accounts.',
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} size="sm" className={cn('p-4', loading && 'opacity-60 transition-opacity')}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{tile.label}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label={`About ${tile.label}`} className="text-muted-foreground/60 hover:text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">{tile.hint}</TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <tile.icon className={cn('h-4 w-4', tile.tone)} aria-hidden />
              <span className={cn('text-xl font-bold tabular-nums', tile.tone)}>{formatPrice(tile.value)}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card size="sm" className="mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-sm text-muted-foreground">
            {summary.voucherCount} voucher{summary.voucherCount === 1 ? '' : 's'} over {summary.byDay.length} day
            {summary.byDay.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net cash movement</span>
          <span
            className={cn(
              'text-lg font-bold tabular-nums',
              summary.netCashMovement > 0 && 'text-emerald-600 dark:text-emerald-400',
              summary.netCashMovement < 0 && 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatPrice(summary.netCashMovement)}
          </span>
        </div>
      </Card>
    </TooltipProvider>
  );
}
