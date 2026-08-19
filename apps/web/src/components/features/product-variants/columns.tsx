'use client';
import { Badge } from '@/components/ui/badge';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

/** Default applied when a variant sets no threshold of its own. Mirrors the schema default. */
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const formatPrice = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `₹${value.toFixed(2)}`;

/** `{ size: 'L', color: 'Red' }` reads as "L / Red" - the way the shelf label would. */
const describeAttributes = (attributes: ProductVariantListItemDto['attributes']): string => {
  if (!attributes || typeof attributes !== 'object') return '';
  return Object.values(attributes)
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(String)
    .join(' / ');
};

export const useProductVariantColumns = () =>
  useMemo<ColumnDef<ProductVariantListItemDto>[]>(
    () => [
      {
        id: 'sku',
        accessorKey: 'sku',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="SKU" />,
        cell: ({ row }) => <code className="font-mono text-xs">{row.original.sku || `#${row.original.id}`}</code>,
      },
      {
        id: 'product',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Product / Variant" />,
        cell: ({ row }) => {
          const description = describeAttributes(row.original.attributes);
          return (
            <div className="flex flex-col">
              {/* Links to the product's own Variants screen, not to an edit page: there is
                  currently no product-edit route (`/admin/products/[id]` was removed). */}
              <Link href={`/admin/products/variants/${row.original.productId}`} className="font-medium hover:underline">
                {row.original.product?.name || `Product #${row.original.productId}`}
              </Link>
              {description && <span className="text-xs text-muted-foreground">{description}</span>}
            </div>
          );
        },
      },
      {
        id: 'sellingPrice',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Selling price" />,
        cell: ({ row }) =>
          row.original.sellingPrice === null ? (
            // A variant with no ledger row cannot be sold at all, so say so rather than showing a zero.
            <Badge variant="destructive">Not priced</Badge>
          ) : (
            <span className="tabular-nums">{formatPrice(row.original.sellingPrice)}</span>
          ),
      },
      {
        id: 'costPrice',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Cost" />,
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatPrice(row.original.costPrice)}</span>,
      },
      {
        id: 'stockQuantity',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Stock" />,
        cell: ({ row }) => {
          const stock = row.original.stockQuantity ?? 0;
          const threshold = row.original.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
          return (
            <span className={`tabular-nums ${stock <= threshold ? 'font-semibold text-destructive' : ''}`}>
              {stock}
              {stock <= threshold && <span className="ml-1 text-xs font-normal">low</span>}
            </span>
          );
        },
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>{row.original.isActive ? 'Active' : 'Retired'}</Badge>
        ),
      },
      {
        id: 'links',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-3 text-xs">
            {/* There is no variant edit endpoint yet, so the ledger is the only thing
                a row can usefully open. */}
            <Link href={`/admin/price-histories?variantId=${row.original.id}`} className="text-primary hover:underline">
              Price history
            </Link>
          </div>
        ),
      },
    ],
    []
  );
