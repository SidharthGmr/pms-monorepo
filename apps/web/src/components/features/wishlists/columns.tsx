'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { WishlistDto } from '@/dtos/wishlist.dto';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

interface WishlistColumnOptions {
  removeRecord: (id: number) => void;
}

export const useWishlistColumns = ({ removeRecord }: WishlistColumnOptions) =>
  useMemo<ColumnDef<WishlistDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ActionTooltip variant="view" tooltip="Open Product" href={`/admin/products/${row.original.productId}`} />
            <ActionTooltip variant="delete" tooltip="Remove From Wishlist" onClick={() => removeRecord(row.original.id)} />
          </div>
        ),
      },
      {
        id: 'product',
        accessorKey: 'productId',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Product" />,
        cell: ({ row }) => {
          const variant = row.original.variant;
          // The variant's own photo wins - it is the thing that was saved.
          const image = variant?.images?.[0] ?? row.original.product?.images?.[0];
          // What distinguishes this SKU: its name, else its attribute combination.
          const variantLabel =
            variant &&
            (variant.name ||
              (variant.attributes && typeof variant.attributes === 'object'
                ? Object.entries(variant.attributes)
                    .map(([key, value]) => `${key}: ${String(value)}`)
                    .join(' · ')
                : '') ||
              variant.sku);
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={row.original.product?.name ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <Link
                  href={`/admin/products/${row.original.productId}`}
                  className="block max-w-[220px] truncate font-medium hover:underline"
                  title={row.original.product?.name}
                >
                  {row.original.product?.name || `Product #${row.original.productId}`}
                </Link>
                {/* A product-level save has no variant, and shows the slug as before. */}
                {variant ? (
                  <span className="flex max-w-[220px] items-center gap-1.5 truncate text-xs">
                    <Badge variant="secondary" className="px-1.5 py-0 font-normal">
                      {variantLabel}
                    </Badge>
                    <code className="truncate font-mono text-[11px] text-muted-foreground">{variant.sku}</code>
                  </span>
                ) : (
                  row.original.product?.slug && (
                    <span className="block max-w-[220px] truncate text-xs text-muted-foreground">{row.original.product.slug}</span>
                  )
                )}
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'productId' },
      },
      {
        id: 'customer',
        accessorKey: 'userId',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Saved By" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.user?.name || '—'}</span>
            <span className="text-xs text-muted-foreground">{row.original.user?.email || row.original.userId}</span>
          </div>
        ),
      },
      {
        id: 'availability',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Availability" />,
        // A saved product can be unpublished or trashed later - that is exactly the
        // case a store wants to spot here, so it gets its own column.
        cell: ({ row }) => {
          const status = row.original.product?.status;
          if (!status) return <span className="text-muted-foreground">—</span>;
          return <Badge variant={status === StatusValues.Published ? 'green' : status === StatusValues.Draft ? 'orange' : 'rose'}>{status}</Badge>;
        },
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'storeCode',
        accessorKey: 'storeCode',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Store" />,
        cell: ({ row }) => <code className="font-mono text-xs uppercase text-muted-foreground">{row.original.storeCode}</code>,
      },
      {
        id: 'addedAt',
        accessorKey: 'addedAt',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Saved On" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {row.original.addedAt ? unitOfService.DateTimeService.convertToLocalDate(row.original.addedAt as unknown as Date, true) : '—'}
            </span>
          );
        },
        meta: { sortingKey: 'addedAt' },
      },
    ],
    [removeRecord]
  );
