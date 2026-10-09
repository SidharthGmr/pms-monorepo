'use client';
import { StatusValues } from '@/enums/status-values.enum';
import { cn } from '@/lib/utils';
import { ProductResponseDto } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { ImageOff } from 'lucide-react';
import { useMemo } from 'react';
import ProductRowActions from './row-action';

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

// Table layout for the product list. Sorting is driven by the page's Sort control, not the headers.
export const useProductColumns = (deleteRecord: (id: number) => void, viewRecord: (id: number) => void, editRecord?: (id: number) => void) =>
  useMemo<ColumnDef<ProductResponseDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: () => <span className={HEADER}>Product</span>,
        cell: ({ row }) => {
          const product = row.original;
          const image = product.images?.[0] ?? null;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                {image ? (
                  // Product images come from arbitrary CDNs; next/image would need each host in
                  // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => viewRecord(product.id)}
                  className="block max-w-[240px] truncate text-left text-sm font-semibold hover:underline"
                  title={product.name}
                >
                  {product.name}
                </button>
                <p className="max-w-[240px] truncate font-mono text-[11px] text-muted-foreground" title={product.slug}>
                  {product.slug}
                </p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'category',
        enableSorting: false,
        header: () => <span className={HEADER}>Category / Brand</span>,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="max-w-[180px] truncate text-xs font-medium" title={row.original.category?.name}>
              {row.original.category?.name ?? '—'}
            </span>
            <span className="max-w-[180px] truncate text-[11px] text-muted-foreground" title={row.original.brandName?.name ?? undefined}>
              {row.original.brandName?.name ?? 'No brand'}
            </span>
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          const tone = STATUS_TONE[row.original.status] ?? { dot: 'bg-muted-foreground', text: 'text-muted-foreground' };
          return (
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
              {row.original.status}
            </span>
          );
        },
        meta: { sortingKey: 'status' },
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
          <ProductRowActions
            product={row.original}
            onView={() => viewRecord(row.original.id)}
            onEdit={editRecord && (() => editRecord(row.original.id))}
            onDelete={() => deleteRecord(row.original.id)}
          />
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [deleteRecord, viewRecord, editRecord]
  );
