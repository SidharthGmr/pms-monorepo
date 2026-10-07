'use client';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { Eye, CornerDownRight, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { CategoryResponseDto } from '@pms/types';
import { Button } from '@/components/ui/button';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  [StatusValues.Published]: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  [StatusValues.Draft]: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  [StatusValues.Trash]: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
};

// "3 days ago" with the exact timestamp on hover; a dash when the column was never set.
function When({ value }: { value?: Date | string | null }) {
  if (!value) return <span className="text-muted-foreground/60">—</span>;
  const date = new Date(value);
  return (
    <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground" title={format(date, 'PPpp')}>
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  );
}

// Table layout for the category list. Sorting is driven by the page's Sort control, not the headers.
// `parentNames` resolves parentId -> name so sub-categories can show where they sit.
export const useCategoryColumns = (parentNames: Map<number, string>, editRecord: (id: number) => void, deleteRecord: (id: number) => void, viewRecord?: (id: number) => void) =>
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
              <span className={cn('flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40', deleted && 'grayscale')}>
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <div className="min-w-0">
                <button type="button" onClick={() => (viewRecord ?? editRecord)(category.id)} className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline" title={category.name}>
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
          const tone = deleted ? STATUS_TONE[StatusValues.Trash] : (STATUS_TONE[row.original.status] ?? { dot: 'bg-muted-foreground', text: 'text-muted-foreground' });
          return (
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
              {deleted ? 'Deleted' : row.original.status}
            </span>
          );
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
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <span className="text-xs">
              <span className="text-muted-foreground/70">Added </span>
              <When value={row.original.createdAt} />
            </span>
            <span className="text-xs">
              <span className="text-muted-foreground/70">Updated </span>
              <When value={row.original.updatedAt} />
            </span>
          </div>
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
            {row.original.deletedAt == null && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRecord(row.original.id)} aria-label={`Delete ${row.original.name}`} title="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [parentNames, editRecord, deleteRecord, viewRecord]
  );
