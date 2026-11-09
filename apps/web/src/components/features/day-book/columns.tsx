'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format-price';
import { JournalEntryDto, JournalStatusEnum, VOUCHER_TYPE_LABELS, VoucherType } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, NotebookPen } from 'lucide-react';
import { useMemo } from 'react';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

const VOUCHER_TONE: Record<VoucherType, string> = {
  SALES: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  RECEIPT: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
  PURCHASE: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  PAYMENT: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
  SALES_RETURN: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
  PURCHASE_RETURN: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
  CONTRA: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300',
  EXPENSE: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-300',
  JOURNAL: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  OPENING: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
};

export const useDayBookColumns = (viewRecord: (id: number) => void) =>
  useMemo<ColumnDef<JournalEntryDto>[]>(
    () => [
      {
        id: 'voucherNumber',
        accessorKey: 'voucherNumber',
        enableSorting: false,
        header: () => <span className={HEADER}>Voucher</span>,
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <NotebookPen className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => viewRecord(entry.id)}
                  className="block max-w-[200px] truncate text-left text-sm font-semibold hover:underline"
                  title={entry.voucherNumber}
                >
                  {entry.voucherNumber}
                </button>
                <p className="text-[11px] text-muted-foreground">{format(new Date(entry.entryDate), 'd MMM yyyy')}</p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'voucherNumber', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'voucherType',
        accessorKey: 'voucherType',
        enableSorting: false,
        header: () => <span className={HEADER}>Type</span>,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={VOUCHER_TONE[row.original.voucherType]}>
              {VOUCHER_TYPE_LABELS[row.original.voucherType]}
            </Badge>
            {row.original.status === JournalStatusEnum.Reversed && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Reversed
              </Badge>
            )}
            {row.original.reversesEntryId != null && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Reversal
              </Badge>
            )}
          </div>
        ),
        meta: { sortingKey: 'voucherType' },
      },
      {
        id: 'narration',
        accessorKey: 'narration',
        enableSorting: false,
        header: () => <span className={HEADER}>Narration</span>,
        cell: ({ row }) => {
          const entry = row.original;
          const accounts = entry.lines.map((entryLine) => entryLine.accountName).join(', ');
          return (
            <div className="min-w-0">
              <p className="max-w-[320px] truncate text-sm" title={entry.narration ?? ''}>
                {entry.narration || '—'}
              </p>
              <p className="max-w-[320px] truncate text-[11px] text-muted-foreground" title={accounts}>
                {entry.referenceNumber ? `${entry.referenceNumber} · ` : ''}
                {accounts}
              </p>
            </div>
          );
        },
        meta: { thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'totalDebit',
        accessorKey: 'totalDebit',
        enableSorting: false,
        header: () => <span className={`${HEADER} block text-right`}>Debit</span>,
        cell: ({ row }) => <span className="block text-right text-sm tabular-nums">{formatPrice(row.original.totalDebit)}</span>,
        meta: { sortingKey: 'totalDebit', thClassName: 'text-right', tdClassName: 'text-right' },
      },
      {
        id: 'totalCredit',
        accessorKey: 'totalCredit',
        enableSorting: false,
        header: () => <span className={`${HEADER} block text-right`}>Credit</span>,
        cell: ({ row }) => <span className="block text-right text-sm tabular-nums">{formatPrice(row.original.totalCredit)}</span>,
        meta: { thClassName: 'text-right', tdClassName: 'text-right' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className={`${HEADER} sr-only`}>Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end pr-4">
            <Button variant="ghost" size="icon" aria-label={`View ${row.original.voucherNumber}`} onClick={() => viewRecord(row.original.id)}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { thClassName: 'text-right', tdClassName: 'text-right' },
      },
    ],
    [viewRecord]
  );

export { VOUCHER_TONE };
