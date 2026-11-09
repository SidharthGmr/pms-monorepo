'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ACCOUNT_CATEGORY_LABELS, ACCOUNT_SUB_TYPE_LABELS, AccountCategory, AccountSubTypeEnum, LedgerAccountDto } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { BookOpen, Lock, Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

const CATEGORY_TONE: Record<AccountCategory, string> = {
  ASSET: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
  LIABILITY: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
  EQUITY: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
  INCOME: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  EXPENSE: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
};

export const useLedgerAccountColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<LedgerAccountDto>[]>(
    () => [
      {
        id: 'code',
        accessorKey: 'code',
        enableSorting: false,
        header: () => <span className={HEADER}>Account</span>,
        cell: ({ row }) => {
          const account = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="max-w-[260px] truncate text-sm font-semibold" title={account.name}>
                  {account.name}
                </p>
                <p className="max-w-[260px] truncate text-[11px] text-muted-foreground">
                  {account.code}
                  {account.parentName ? ` · under ${account.parentName}` : ''}
                </p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'code', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'category',
        accessorKey: 'category',
        enableSorting: false,
        header: () => <span className={HEADER}>Category</span>,
        cell: ({ row }) => (
          <Badge variant="outline" className={CATEGORY_TONE[row.original.category]}>
            {ACCOUNT_CATEGORY_LABELS[row.original.category]}
          </Badge>
        ),
        meta: { sortingKey: 'category' },
      },
      {
        id: 'subType',
        accessorKey: 'subType',
        enableSorting: false,
        header: () => <span className={HEADER}>Type</span>,
        cell: ({ row }) =>
          row.original.subType === AccountSubTypeEnum.Other ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <span className="text-sm">{ACCOUNT_SUB_TYPE_LABELS[row.original.subType]}</span>
          ),
        meta: { sortingKey: 'subType', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'state',
        enableSorting: false,
        header: () => <span className={HEADER}>State</span>,
        cell: ({ row }) => {
          const account = row.original;
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {account.hasChildren && (
                <Badge variant="outline" className="text-[10px]" title="A heading rolls its children up and takes no postings of its own">
                  Heading
                </Badge>
              )}
              {account.isSystem && (
                <Badge variant="outline" className="gap-1 text-[10px]" title="Posting rules resolve this account by name">
                  <Lock className="h-3 w-3" />
                  System
                </Badge>
              )}
              {!account.isActive && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
          );
        },
        meta: { thClassName: 'hidden lg:table-cell', tdClassName: 'hidden lg:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className={`${HEADER} sr-only`}>Actions</span>,
        cell: ({ row }) => {
          const account = row.original;
          return (
            <div className="flex items-center justify-end gap-1 pr-4">
              <Button variant="ghost" size="icon" aria-label={`Edit ${account.name}`} onClick={() => editRecord(account.id)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${account.name}`}
                disabled={account.isSystem}
                title={account.isSystem ? 'A system account cannot be deleted' : undefined}
                onClick={() => deleteRecord(account.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        meta: { thClassName: 'text-right', tdClassName: 'text-right' },
      },
    ],
    [editRecord, deleteRecord]
  );
