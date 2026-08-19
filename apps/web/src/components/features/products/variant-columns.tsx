'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { Badge } from '../../ui/badge';

export const useProductVariantColumns = (onEdit?: (variant: ProductVariantDto) => void) =>
  useMemo<ColumnDef<ProductVariantDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        // Price changes go through the ledger screen; "Edit" only touches the variant's
        // safe fields (name, sku, barcode, threshold, active).
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {onEdit && row.original.isActive && (
              <ActionTooltip variant="edit" tooltip="Edit variant" onClick={() => onEdit(row.original)} />
            )}
            <ActionTooltip
              variant="default"
              icon={<History className="h-4 w-4" />}
              tooltip="Price history for this variant"
              href={`/admin/price-histories?productId=${row.original.productId}&variantId=${row.original.id}`}
            />
          </div>
        ),
      },
      {
        id: 'variant',
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Variant" />
        ),
        cell: ({ row }) => {
          const attributes = row.original.attributes;
          const pairs = attributes && typeof attributes === 'object' ? Object.entries(attributes) : [];

          return (
            <div className="flex flex-col gap-1">
              {pairs.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {pairs.map(([key, value]) => (
                    <Badge key={key} variant="zinc" className="font-normal">
                      <span className="uppercase text-muted-foreground">{key}</span>
                      <span className="mx-1">·</span>
                      <span className="font-medium">{String(value)}</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                // Rows created by a bare price change carry no attributes.
                <span className="text-xs text-muted-foreground">Price-only row</span>
              )}
              {row.original.sku && <code className="font-mono text-xs text-muted-foreground">{row.original.sku}</code>}
            </div>
          );
        },
      },
      {
        id: 'stockQuantity',
        accessorKey: 'stockQuantity',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Stock" />,
        cell: ({ row }) => <div className="tabular-nums">{row.original.stockQuantity ?? 0}</div>,
      },
      {
        id: 'effectiveFrom',
        accessorKey: 'effectiveFrom',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Effective From" />
        ),
        cell: ({ row }) => (
          <div>{row.original.effectiveFrom ? format(new Date(row.original.effectiveFrom), 'PPpp') : '-'}</div>
        ),
        meta: { sortingKey: 'effectiveFrom' },
      },
      {
        id: 'sellingPrice',
        accessorKey: 'sellingPrice',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Selling Price" />
        ),
        cell: ({ row }) => {
          const value = row.original.sellingPrice;
          return <div className="font-medium">{value != null ? `$${Number(value).toFixed(2)}` : '—'}</div>;
        },
        meta: { sortingKey: 'sellingPrice' },
      },
      {
        id: 'costPrice',
        accessorKey: 'costPrice',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Cost Price" />
        ),
        cell: ({ row }) => {
          const value = row.original.costPrice;
          return <div className="text-muted-foreground">{value != null ? `$${Number(value).toFixed(2)}` : '—'}</div>;
        },
        meta: { sortingKey: 'costPrice' },
      },
      {
        id: 'margin',
        accessorKey: 'margin',
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Margin" />
        ),
        cell: ({ row }) => {
          const { sellingPrice, costPrice } = row.original;
          if (sellingPrice == null || costPrice == null || Number(sellingPrice) === 0) return <div>—</div>;
          const margin = ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100;
          return <div className={margin < 0 ? 'text-destructive' : 'text-green-600'}>{margin.toFixed(1)}%</div>;
        },
        meta: { sortingKey: 'margin' },
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'scusses' : 'orange'}>{row.original.isActive ? 'Active' : 'Superseded'}</Badge>
        ),
        meta: { sortingKey: 'isActive' },
      },
      {
        id: 'reason',
        accessorKey: 'reason',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Reason" />
        ),
        cell: ({ row }) => <div>{row.original.reason || '-'}</div>,
        meta: { sortingKey: 'reason' },
      },
    ],
    [onEdit]
  );
