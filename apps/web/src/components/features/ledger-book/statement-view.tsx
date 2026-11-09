'use client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { LedgerStatementDto, VOUCHER_TYPE_LABELS } from '@pms/types';
import { format } from 'date-fns';
import { BookOpen } from 'lucide-react';

interface StatementViewProps {
  statement?: LedgerStatementDto;
  loading?: boolean;
  error?: boolean;
}

/** A balance is quoted on the side the account naturally sits; the other way round is a sign. */
const balanceLabel = (statement: LedgerStatementDto, value: number) => {
  if (value === 0) return '0.00';
  const onNaturalSide = value > 0;
  const side = statement.nature === 'DEBIT' ? (onNaturalSide ? 'Dr' : 'Cr') : onNaturalSide ? 'Cr' : 'Dr';
  return `${formatPrice(Math.abs(value))} ${side}`;
};

export default function StatementView({ statement, loading, error }: StatementViewProps) {
  if (error) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load this ledger</p>
        <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
      </Card>
    );
  }

  if (loading && !statement) {
    return (
      <Card className="space-y-3 p-6">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (!statement) {
    return (
      <Card className="py-16 text-center">
        <BookOpen className="mx-auto h-6 w-6 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">Pick an account to see its ledger.</p>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden p-0 md:p-0', loading && 'opacity-60 transition-opacity')}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-bold">{statement.name}</h2>
            <Badge variant="outline" className="text-[10px]">
              {statement.code}
            </Badge>
            {statement.partyName && <Badge variant="outline" className="text-[10px]">{statement.partyName}</Badge>}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {statement.startDate ? format(new Date(statement.startDate), 'd MMM yyyy') : 'From the beginning'}
            {' — '}
            {statement.endDate ? format(new Date(statement.endDate), 'd MMM yyyy') : 'today'}
            {` · ${statement.rowCount} entr${statement.rowCount === 1 ? 'y' : 'ies'}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Closing balance</p>
          <p className="text-xl font-bold tabular-nums">{balanceLabel(statement, statement.closingBalance)}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5 text-[11px] uppercase tracking-wider">Date</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Particulars</TableHead>
            <TableHead className="text-right text-[11px] uppercase tracking-wider">Debit</TableHead>
            <TableHead className="text-right text-[11px] uppercase tracking-wider">Credit</TableHead>
            <TableHead className="pr-5 text-right text-[11px] uppercase tracking-wider">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-muted/20">
            <TableCell className="pl-5 text-xs text-muted-foreground">
              {statement.startDate ? format(new Date(statement.startDate), 'd MMM yyyy') : '—'}
            </TableCell>
            <TableCell className="text-xs font-medium text-muted-foreground">Opening balance</TableCell>
            <TableCell />
            <TableCell />
            <TableCell className="pr-5 text-right text-xs font-semibold tabular-nums">{balanceLabel(statement, statement.openingBalance)}</TableCell>
          </TableRow>

          {statement.rows.map((row) => (
            <TableRow key={row.lineId}>
              <TableCell className="pl-5 align-top text-xs tabular-nums">{format(new Date(row.entryDate), 'd MMM yyyy')}</TableCell>
              <TableCell className="align-top">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{row.voucherNumber}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {VOUCHER_TYPE_LABELS[row.voucherType]}
                  </Badge>
                </div>
                {row.narration && <p className="mt-0.5 max-w-[380px] truncate text-[11px] text-muted-foreground">{row.narration}</p>}
                {row.contraAccounts.length > 0 && (
                  <p className="mt-0.5 max-w-[380px] truncate text-[11px] text-muted-foreground">To: {row.contraAccounts.join(', ')}</p>
                )}
              </TableCell>
              <TableCell className="align-top text-right text-sm tabular-nums">{row.debit > 0 ? formatPrice(row.debit) : '—'}</TableCell>
              <TableCell className="align-top text-right text-sm tabular-nums">{row.credit > 0 ? formatPrice(row.credit) : '—'}</TableCell>
              <TableCell className="pr-5 align-top text-right text-sm tabular-nums">{balanceLabel(statement, row.balance)}</TableCell>
            </TableRow>
          ))}

          {statement.rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                No movement in this period.
              </TableCell>
            </TableRow>
          )}

          <TableRow className="border-t-2 bg-muted/30 font-semibold">
            <TableCell className="pl-5" />
            <TableCell className="text-sm">Closing balance</TableCell>
            <TableCell className="text-right text-sm tabular-nums">{formatPrice(statement.totalDebit)}</TableCell>
            <TableCell className="text-right text-sm tabular-nums">{formatPrice(statement.totalCredit)}</TableCell>
            <TableCell className="pr-5 text-right text-sm tabular-nums">{balanceLabel(statement, statement.closingBalance)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}
