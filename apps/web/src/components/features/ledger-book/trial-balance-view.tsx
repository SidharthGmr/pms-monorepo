'use client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ACCOUNT_CATEGORY_LABELS, TrialBalanceDto } from '@pms/types';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TrialBalanceViewProps {
  trialBalance?: TrialBalanceDto;
  loading?: boolean;
  error?: boolean;
}

export default function TrialBalanceView({ trialBalance, loading, error }: TrialBalanceViewProps) {
  if (error) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load the trial balance</p>
      </Card>
    );
  }

  if (loading && !trialBalance) {
    return (
      <Card className="space-y-3 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (!trialBalance) return null;

  return (
    <Card className={cn('overflow-hidden p-0 md:p-0', loading && 'opacity-60 transition-opacity')}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
        <div>
          <h2 className="text-base font-bold">Trial Balance</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Every account with a balance, derived from the journal.</p>
        </div>
        {trialBalance.isBalanced ? (
          <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Balanced
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Out by {formatPrice(Math.abs(trialBalance.difference))}
          </Badge>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5 text-[11px] uppercase tracking-wider">Account</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Category</TableHead>
            <TableHead className="text-right text-[11px] uppercase tracking-wider">Debit</TableHead>
            <TableHead className="pr-5 text-right text-[11px] uppercase tracking-wider">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trialBalance.rows.map((row) => (
            <TableRow key={row.accountId}>
              <TableCell className="pl-5">
                <p className="text-sm font-medium">{row.name}</p>
                <p className="text-[11px] text-muted-foreground">{row.code}</p>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{ACCOUNT_CATEGORY_LABELS[row.category]}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{row.debit > 0 ? formatPrice(row.debit) : '—'}</TableCell>
              <TableCell className="pr-5 text-right text-sm tabular-nums">{row.credit > 0 ? formatPrice(row.credit) : '—'}</TableCell>
            </TableRow>
          ))}

          {trialBalance.rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                Nothing posted in this period.
              </TableCell>
            </TableRow>
          )}

          <TableRow className="border-t-2 bg-muted/30 font-semibold">
            <TableCell className="pl-5 text-sm">Total</TableCell>
            <TableCell />
            <TableCell className="text-right text-sm tabular-nums">{formatPrice(trialBalance.totalDebit)}</TableCell>
            <TableCell className="pr-5 text-right text-sm tabular-nums">{formatPrice(trialBalance.totalCredit)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}
