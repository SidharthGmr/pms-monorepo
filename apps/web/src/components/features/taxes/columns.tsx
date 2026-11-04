'use client';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { TaxDto } from '@pms/types';
import { TAX_CATEGORY_LABELS } from '@/data/tax.data';
import RecordTimestamps from '@/components/common/record-timestamps';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { cn } from '@/lib/utils';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';
const PILL = 'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium';

// Table layout for the tax list. Sorting is driven by the page's Sort control, not the headers.
export const useTaxColumns = (editRecord: (id: string) => void, deleteRecord: (id: string) => void) =>
  useMemo<ColumnDef<TaxDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Tax</span>,
        cell: ({ row }) => {
          const tax = row.original;
          return (
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => editRecord(tax.id)}
                className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline"
                title={tax.name}
              >
                {tax.name}
              </button>
              <p className="font-mono text-[11px] text-muted-foreground">{tax.code}</p>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'rate',
        accessorKey: 'rate',
        enableSorting: false,
        header: () => <span className={HEADER}>Rate</span>,
        cell: ({ row }) => <span className="text-sm font-medium tabular-nums">{row.original.rate.toFixed(2)}%</span>,
        meta: { sortingKey: 'rate', thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'category',
        accessorKey: 'category',
        enableSorting: false,
        header: () => <span className={HEADER}>Category</span>,
        cell: ({ row }) => (
          <span className={cn(PILL, 'bg-muted text-muted-foreground')}>{TAX_CATEGORY_LABELS[row.original.category] ?? row.original.category}</span>
        ),
        meta: { sortingKey: 'category' },
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                PILL,
                row.original.isActive ? 'border-emerald-600 bg-emerald-100 text-emerald-700' : 'border-rose-600 bg-rose-100 text-rose-700'
              )}
            >
              {row.original.isActive ? 'Active' : 'Inactive'}
            </span>
            {row.original.isDefault && <span className={cn(PILL, 'border-sky-600 bg-sky-100 text-sky-700')}>Default</span>}
          </div>
        ),
        meta: { sortingKey: 'isActive' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Added / Updated</span>,
        cell: ({ row }) => <RecordTimestamps createdAt={row.original.createdAt} updatedAt={row.original.updatedAt} />,
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <ActionTooltip variant="edit" tooltip="Edit" ariaLabel={`Edit ${row.original.name}`} onClick={() => editRecord(row.original.id)} />
            <ActionTooltip
              variant="delete"
              tooltip="Delete"
              ariaLabel={`Delete ${row.original.name}`}
              onClick={() => deleteRecord(row.original.id)}
            />
          </div>
        ),
        meta: { thClassName: 'w-24 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord]
  );
