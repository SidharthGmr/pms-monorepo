'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import VariantRating from './variant-rating';
import RateVariantButton from './rate-variant-button';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { Badge } from '../../ui/badge';
import { ProductVariantListItemDto } from '@pms/types';
import { container } from '@/config/ioc';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { TYPES } from '@/config/types';

export const useProductVariantColumns = (onEdit?: (variant: ProductVariantListItemDto) => void) =>
  useMemo<ColumnDef<ProductVariantListItemDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {onEdit && <ActionTooltip variant="edit" tooltip="Edit variant" onClick={() => onEdit(row.original)} />}
            <RateVariantButton
              variantId={row.original.id}
              variantName={row.original.name}
              sku={row.original.sku}
              rating={row.original.rating}
              ratingCount={row.original.ratingCount}
              variant="ghost"
              size="icon"
              label=""
            />
            <ActionTooltip
              variant="default"
              icon={<History className="h-4 w-4" />}
              tooltip="Price history for this variant"
              href={`/admin/price-histories?productId=${row.original?.product?.id}&variantId=${row.original.id}`}
            />
          </div>
        ),
      },
      {
        id: 'variant',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Variant" />,
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
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Stock" />,
        cell: ({ row }) => <div className="tabular-nums">{row.original.stockQuantity ?? 0}</div>,
      },
      {
        id: 'effectiveFrom',
        accessorKey: 'effectiveFrom',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="" title="Effective From" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {row.original.effectiveFrom ? unitOfService.DateTimeService.convertToLocalDate(row.original.effectiveFrom, true) : '—'}
            </span>
          );
        },
      },
      {
        id: 'effectiveTo',
        accessorKey: 'effectiveTo',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="" title="Effective To" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {row.original.effectiveTo ? unitOfService.DateTimeService.convertToLocalDate(row.original.effectiveTo, true) : '—'}
            </span>
          );
        },
      },
      {
        id: 'sellingPrice',
        accessorKey: 'sellingPrice',
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Selling Price" />,
        cell: ({ row }) => {
          const value = row.original.sellingPrice;
          return <div className="font-medium">{value != null ? `$${Number(value).toFixed(2)}` : '—'}</div>;
        },
        meta: { sortingKey: 'sellingPrice' },
      },
      {
        id: 'costPrice',
        accessorKey: 'costPrice',
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Cost Price" />,
        cell: ({ row }) => {
          const value = row.original.costPrice;
          return <div className="text-muted-foreground">{value != null ? `$${Number(value).toFixed(2)}` : '—'}</div>;
        },
        meta: { sortingKey: 'costPrice' },
      },
      {
        id: 'offerPrice',
        accessorKey: 'offerPrice',
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Offer Price" />,
        cell: ({ row }) => {
          const value = row.original.offerPrice;
          return <div className="text-muted-foreground">{value != null ? `$${Number(value).toFixed(2)}` : '—'}</div>;
        },
        meta: { sortingKey: 'offerPrice' },
      },
      {
        id: 'margin',
        accessorKey: 'margin',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Margin" />,
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
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Status" />,
        cell: ({ row }) => <Badge variant={row.original.isActive ? 'scusses' : 'orange'}>{row.original.isActive ? 'Active' : 'Superseded'}</Badge>,
        meta: { sortingKey: 'isActive' },
      },
      {
        id: 'rating',
        accessorKey: 'rating',
        // `rating` is a real column, but the API only allow-lists sku/name/createdAt/id.
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Rating" />,
        cell: ({ row }) => <VariantRating variantId={row.original.id} rating={row.original.rating} ratingCount={row.original.ratingCount} />,
      },
      {
        id: 'description',
        accessorKey: 'description',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Description" />,
        cell: ({ row }) => <div>{row.original?.description || '-'}</div>,
      },
    ],
    [onEdit]
  );
