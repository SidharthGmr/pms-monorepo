'use client';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ListChecks, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import RecordTimestamps from '@/components/common/record-timestamps';
import StatusBadge from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';


import { cn } from '@/lib/utils';
import { MasterAttributeDto, StatusValues } from '@pms/types';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// Table layout for the attribute list. Sorting is driven by the page's Sort control, not the headers.
export const useMasterAttributeColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<MasterAttributeDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Attribute</span>,
        cell: ({ row }) => {
          const attribute = row.original;
          const scope = [attribute.category?.name, attribute.brandName?.name].filter(Boolean).join(' · ');
          const trashed = attribute.status === StatusValues.Trash;
          return (
            <div className="flex items-center gap-3">
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-[11px] font-bold uppercase tracking-wide text-primary', trashed && 'grayscale')}>
                {attribute.code.slice(0, 3)}
              </span>
              <div className="min-w-0">
                <button type="button" onClick={() => editRecord(+attribute.id)} className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline" title={attribute.name}>
                  {attribute.name}
                </button>
                <p className="truncate text-[11px] text-muted-foreground" title={attribute.description || scope || undefined}>
                  {attribute.description || (scope ? `Scoped to ${scope}` : 'Store-wide')}
                </p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'code',
        accessorKey: 'code',
        enableSorting: false,
        header: () => <span className={HEADER}>Code</span>,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium uppercase">{row.original.code}</code>
            {row.original.unit && <span className="text-[11px] text-muted-foreground">in {row.original.unit}</span>}
          </span>
        ),
        meta: { sortingKey: 'code' },
      },
      {
        id: 'entryCount',
        accessorKey: 'entryCount',
        enableSorting: false,
        header: () => <span className={HEADER}>Values</span>,
        // Deep-links into the entries screen pre-filtered to this attribute.
        cell: ({ row }) => {
          const count = row.original.entryCount ?? 0;
          return (
            <Link
              href={`/admin/master-entries?attributeId=${row.original.id}`}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
                count > 0 ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <ListChecks className="h-3.5 w-3.5" />
              {count} {count === 1 ? 'value' : 'values'}
            </Link>
          );
        },
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          return <StatusBadge status={row.original.status} />;
        },
        meta: { sortingKey: 'status' },
      },
      {
        id: 'displayOrder',
        accessorKey: 'displayOrder',
        enableSorting: false,
        header: () => <span className={HEADER}>Order</span>,
        cell: ({ row }) => (
          <span className="inline-flex min-w-7 justify-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">{row.original.displayOrder ?? '—'}</span>
        ),
        meta: { sortingKey: 'displayOrder', thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Added / Updated</span>,
        cell: ({ row }) => (
          <RecordTimestamps createdAt={row.original.createdAt} updatedAt={row.original.updatedAt} />
        ),
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => editRecord(+row.original.id)} aria-label={`Edit ${row.original.name}`} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRecord(+row.original.id)} aria-label={`Delete ${row.original.name}`} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { thClassName: 'w-24 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord]
  );
