'use client';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CornerDownRight, ImageOff } from 'lucide-react';
import { CategoryResponseDto } from '@pms/types';
import RecordTimestamps from '@/components/common/record-timestamps';
import StatusBadge from '@/components/common/status-badge';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { cn } from '@/lib/utils';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// Table layout for the category list. Sorting is driven by the page's Sort control, not the headers.
// `parentNames` resolves parentId -> name so sub-categories can show where they sit.
export const useCategoryColumns = (
  parentNames: Map<number, string>,
  editRecord: (id: number) => void,
  deleteRecord: (id: number) => void,
  viewRecord?: (id: number) => void
) =>
  useMemo<ColumnDef<CategoryResponseDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Category</span>,
        cell: ({ row }) => {
          const category = row.original;
          const image = category.images?.[0];
          const deleted = category.deletedAt != null;
          const parent = category.parentId != null ? (parentNames.get(category.parentId) ?? 'Sub-category') : null;
          return (
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40',
                  deleted && 'grayscale'
                )}
              >
                {image ? (
                  <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => (viewRecord ?? editRecord)(category.id)}
                  className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline"
                  title={category.name}
                >
                  {category.name}
                </button>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {parent ? (
                    <>
                      <CornerDownRight className="h-3 w-3 shrink-0" />
                      <span className="truncate">{parent}</span>
                    </>
                  ) : (
                    'Top level'
                  )}
                </p>
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
          const deleted = row.original.deletedAt != null;
          return <StatusBadge status={deleted ? 'Deleted' : row.original.status} />;
        },
        meta: { sortingKey: 'status' },
      },
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
            {viewRecord && (
              <ActionTooltip variant="view" tooltip="View" ariaLabel={`View ${row.original.name}`} onClick={() => viewRecord(row.original.id)} />
            )}
            <ActionTooltip variant="edit" tooltip="Edit" ariaLabel={`Edit ${row.original.name}`} onClick={() => editRecord(row.original.id)} />
            {row.original.deletedAt == null && (
              <ActionTooltip
                variant="delete"
                tooltip="Delete"
                ariaLabel={`Delete ${row.original.name}`}
                onClick={() => deleteRecord(row.original.id)}
              />
            )}
          </div>
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [parentNames, editRecord, deleteRecord, viewRecord]
  );
