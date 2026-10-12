'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SubscriberDto } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { Mail, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

export const useSubscriberColumns = (deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<SubscriberDto>[]>(
    () => [
      {
        id: 'email',
        accessorKey: 'email',
        enableSorting: false,
        header: () => <span className={HEADER}>Email</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <Mail className="h-4 w-4" />
            </span>
            <p className="max-w-[260px] truncate text-sm font-medium" title={row.original.email}>
              {row.original.email}
            </p>
          </div>
        ),
        meta: { sortingKey: 'email', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Subscribed</span>,
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap" title={format(date, 'PPpp')}>
              <span className="text-xs font-medium tabular-nums">{format(date, 'd MMM yyyy')}</span>
              <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>
            </div>
          );
        },
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          const active = row.original.unsubscribedAt == null;
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-muted-foreground')} />
              {active ? 'Subscribed' : 'Unsubscribed'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete"
              aria-label={`Delete ${row.original.email}`}
              onClick={() => deleteRecord(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { thClassName: 'w-16 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [deleteRecord]
  );
