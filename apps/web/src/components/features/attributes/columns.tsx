'use client';
import RecordTimestamps from '@/components/common/record-timestamps';
import StatusBadge from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { AttributeDto } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Ruler, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// Table layout for the attribute list. Sorting is driven by the page's Sort control, not the headers.
export const useAttributeColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void, viewRecord?: (id: number) => void) =>
  useMemo<ColumnDef<AttributeDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Attribute</span>,
        cell: ({ row }) => {
          const attribute = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Ruler className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => (viewRecord ?? editRecord)(attribute.id)}
                  className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline"
                  title={attribute.name}
                >
                  {attribute.name}
                </button>
                <p className="text-[11px] text-muted-foreground">{attribute.unit?.trim() ? `Measured in ${attribute.unit}` : 'No unit'}</p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
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
            {viewRecord && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => viewRecord(row.original.id)} aria-label={`View ${row.original.name}`} title="View">
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => editRecord(row.original.id)} aria-label={`Edit ${row.original.name}`} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRecord(row.original.id)} aria-label={`Delete ${row.original.name}`} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord, viewRecord]
  );
