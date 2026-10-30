'use client';
import RecordTimestamps from '@/components/common/record-timestamps';
import StatusBadge from '@/components/common/status-badge';
import { ProductResponseDto } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { ImageOff } from 'lucide-react';
import { useMemo } from 'react';
import ProductRowActions from './row-action';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

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
              <span className={cn('flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40')}>
                {image ? (
                  <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>

              <div className="min-w-0">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="block max-w-[260px] truncate text-left text-sm font-semibold hover:underline"
                  title={product.name}
                >
                  {product.name}
                </Link>
                {/* <button
                  type="button"
                  onClick={() => viewRecord(product.id)}
                  className="block max-w-[240px] truncate text-left text-sm font-semibold hover:underline"
                  title={product.name}
                >
                  {product.name}
                </button> */}
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
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Added / Updated</span>,
        cell: ({ row }) => <RecordTimestamps createdAt={row.original.createdAt} updatedAt={row.original.updatedAt} />,
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
    ],
    [deleteRecord, viewRecord, editRecord]
  );
