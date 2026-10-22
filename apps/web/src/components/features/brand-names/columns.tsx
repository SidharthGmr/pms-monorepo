'use client';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { BrandNameDto, StatusValues } from '@pms/types';
import RecordTimestamps from '@/components/common/record-timestamps';
import StatusBadge from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// Table layout for the brand list. Sorting is driven by the page's Sort control, not the headers.
export const useBrandNameColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void, viewRecord?: (id: number) => void) =>
  useMemo<ColumnDef<BrandNameDto>[]>(
    () => [
      {
        id: 'displayOrder',
        accessorKey: 'displayOrder',
        enableSorting: false,
        header: () => <span className={HEADER}>Order</span>,
        cell: ({ row }) => (
          <span className="inline-flex min-w-7 justify-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">
            {row.original.displayOrder ?? '—'}
          </span>
        ),
        meta: { sortingKey: 'displayOrder', thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Brand</span>,
        cell: ({ row }) => {
          const brand = row.original;
          const logo = brand.images?.[0];
          const trashed = brand.status === StatusValues.Trash;
          return (
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40',
                  trashed && 'grayscale'
                )}
              >
                {logo ? (
                  <img src={logo} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => (viewRecord ?? editRecord)(brand.id)}
                  className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline"
                  title={brand.name}
                >
                  {brand.name}
                </button>
                <p className="text-[11px] text-muted-foreground">ID {brand.id}</p>
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
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { sortingKey: 'status' },
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
          <div className="flex items-center justify-end gap-0.5">
            {viewRecord && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => viewRecord(row.original.id)}
                aria-label={`View ${row.original.name}`}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => editRecord(row.original.id)}
              aria-label={`Edit ${row.original.name}`}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteRecord(row.original.id)}
              aria-label={`Delete ${row.original.name}`}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord, viewRecord]
  );
