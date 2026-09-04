'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, History } from 'lucide-react';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { Badge } from '../../ui/badge';
import { ProductVariantListItemDto } from '@pms/types';
import { container } from '@/config/ioc';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { TYPES } from '@/config/types';

/** Matches CurrencyInput's locale and prefix, so the table and the form agree. */
const money = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const asDate = (value: Date | string | null | undefined) => (value ? new Date(value) : null);

export const useProductVariantColumns = (onEdit?: (variant: ProductVariantListItemDto) => void) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMemo<ColumnDef<ProductVariantListItemDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {onEdit && <ActionTooltip variant="edit" tooltip="Edit variant" onClick={() => onEdit(row.original)} />}
            {/* <RateVariantButton
              variantId={row.original.id}
              variantName={row.original.name}
              sku={row.original.sku}
              rating={row.original.rating}
              ratingCount={row.original.ratingCount}
              variant="ghost"
              size="icon"
              label=""
            /> */}
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
        // `name` is the API's sort key, and the only sortable columns are sku/name/createdAt/id.
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Variant" />,
        meta: { sortingKey: 'name' },
        cell: ({ row }) => {
          const { name, sku, product } = row.original;

          return (
            <div className="flex min-w-[180px] max-w-[280px] flex-col gap-1">
              <span className="font-medium leading-tight">{name}</span>
              {product?.name && <span className="text-xs text-muted-foreground">{product.name}</span>}
              {/* {pairs.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pairs.map(([key, value]) => (
                    <Badge key={key} variant="zinc" className="font-normal">
                      <span className="uppercase text-muted-foreground">{key}</span>
                      <span className="mx-1">·</span>
                      <span className="font-medium">{String(value)}</span>
                    </Badge>
                  ))}
                </div>
              )} */}
              {sku && <code className="font-mono text-xs text-muted-foreground">{sku}</code>}
            </div>
          );
        },
      },
      {
        id: 'costPrice',
        accessorKey: 'costPrice',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Cost" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-muted-foreground">
            {row.original.costPrice != null ? money(Number(row.original.costPrice)) : '—'}
          </span>
        ),
      },
      {
        // One column for what is actually charged. `offerPrice` on its own said nothing about
        // whether the offer was live, so the table could not be read against the storefront.
        id: 'price',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Price" />,
        cell: ({ row }) => {
          const { sellingPrice, offerPrice, isOffer } = row.original;
          if (sellingPrice == null) return <span className="text-muted-foreground">—</span>;

          const live = isOffer && offerPrice != null;
          const savings = live ? Math.round((1 - Number(offerPrice) / Number(sellingPrice)) * 100) : 0;

          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tabular-nums">{money(live ? Number(offerPrice) : Number(sellingPrice))}</span>
                {live && <span className="text-xs tabular-nums text-muted-foreground line-through">{money(Number(sellingPrice))}</span>}
              </div>
              {live && savings > 0 && (
                <Badge variant="emerald" className="w-fit font-normal">
                  {savings}% off
                </Badge>
              )}
              {!isOffer && offerPrice != null && <span className="text-[11px] text-muted-foreground">Offer {money(Number(offerPrice))} staged</span>}
            </div>
          );
        },
      },

      {
        id: 'margin',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Margin" />,
        cell: ({ row }) => {
          const { sellingPrice, costPrice } = row.original;
          if (sellingPrice == null || costPrice == null || Number(sellingPrice) === 0) return <span className="text-muted-foreground">—</span>;

          const margin = ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100;
          return (
            <Badge variant={margin < 0 ? 'rose' : 'emerald'} className="font-normal tabular-nums">
              {margin.toFixed(1)}%
            </Badge>
          );
        },
      },
      {
        id: 'stockQuantity',
        accessorKey: 'stockQuantity',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Stock" />,
        cell: ({ row }) => {
          const stock = row.original.stockQuantity ?? 0;
          const threshold = row.original.lowStockThreshold;
          const low = threshold != null && stock <= threshold;

          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={low ? 'font-semibold tabular-nums text-orange-600' : 'tabular-nums'}>{stock}</span>
              {low && (
                <Badge variant="orange" className="gap-1 font-normal">
                  <AlertTriangle className="h-3 w-3" />
                  {stock === 0 ? 'Out' : 'Low'}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        // The two date columns read as one fact - the period this price covers - and an end date
        // that has passed leaves the variant with no price at all, which is worth flagging.
        id: 'priceWindow',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Price Window" />,
        cell: ({ row }) => {
          const from = asDate(row.original.effectiveFrom);
          const to = asDate(row.original.effectiveTo);
          if (!from && !to) return <span className="text-muted-foreground">—</span>;

          const expired = to != null && to.getTime() < Date.now();

          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              <span>
                {from ? unitOfService.DateTimeService.convertToLocalDate(from, true) : '—'}
                <span className="mx-1">→</span>
                {to ? unitOfService.DateTimeService.convertToLocalDate(to, true) : 'open'}
              </span>
              {expired && (
                <Badge variant="rose" className="w-fit font-normal">
                  Expired — unpriced
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Status" />,
        cell: ({ row }) => <Badge variant={row.original.isActive ? 'scusses' : 'zinc'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>,
      },
      // {
      //   id: 'rating',
      //   accessorKey: 'rating',
      //   // `rating` is a real column, but the API only allow-lists sku/name/createdAt/id.
      //   enableSorting: false,
      //   header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Rating" />,
      //   cell: ({ row }) => <VariantRating variantId={row.original.id} rating={row.original.rating} ratingCount={row.original.ratingCount} />,
      // },
      {
        id: 'description',
        accessorKey: 'description',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className=" " title="Description" />,
        cell: ({ row }) => (
          <p className="line-clamp-2 max-w-[240px] text-xs text-muted-foreground" title={row.original.description ?? undefined}>
            {row.original.description || '—'}
          </p>
        ),
      },
    ],
    [onEdit, unitOfService]
  );
};
