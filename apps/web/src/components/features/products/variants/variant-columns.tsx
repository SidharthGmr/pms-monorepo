'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Eye, History, ImageOff, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

/** Matches CurrencyInput's locale and prefix, so the table and the form agree. */
const money = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const viewHrefFor = (variant: ProductVariantDto) => `/admin/products/variants/${variant.id}`;

// Table layout for one product's variants, matching the store-wide SKU list. Price changes go
// through the ledger screen; "Edit" only touches the variant's safe fields.
export const useProductVariantColumns = (onEdit?: (variant: ProductVariantDto) => void) =>
  useMemo<ColumnDef<ProductVariantDto>[]>(
    () => [
      {
        id: 'variant',
        enableSorting: false,
        header: () => <span className={HEADER}>Variant</span>,
        cell: ({ row }) => {
          const variant = row.original;
          const image = variant.images?.[0];

          return (
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                {image ? (
                  // Variant images come from arbitrary CDNs; next/image would need each host in
                  // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={variant.name ?? variant.sku ?? 'Variant'} className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <div className="min-w-0">
                <Link
                  href={viewHrefFor(variant)}
                  target="_blank"
                  className="block max-w-[240px] truncate text-left text-sm font-semibold hover:underline"
                  title={variant.name ?? variant.sku}
                >
                  {variant.name ?? variant.sku ?? `Variant #${variant.id}`}
                </Link>
                {variant.sku && <code className="block truncate font-mono text-[11px] text-muted-foreground/80">{variant.sku}</code>}
              </div>
            </div>
          );
        },
        meta: { thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        // One column for what is actually charged, read the same way the storefront charges it.
        id: 'price',
        enableSorting: false,
        header: () => <span className={HEADER}>Price</span>,
        cell: ({ row }) => {
          const { sellingPrice, offerPrice, isOffer } = row.original;
          if (sellingPrice == null) return <span className="text-xs text-muted-foreground/60">Unpriced</span>;

          const live = isOffer && offerPrice != null;
          const savings = live ? Math.round((1 - Number(offerPrice) / Number(sellingPrice)) * 100) : 0;

          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-sm font-semibold tabular-nums">{money(live ? Number(offerPrice) : Number(sellingPrice))}</span>
              {live && <span className="text-xs tabular-nums text-muted-foreground line-through">{money(Number(sellingPrice))}</span>}
              {live && savings > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {savings}% off
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'costPrice',
        accessorKey: 'costPrice',
        enableSorting: false,
        header: () => <span className={HEADER}>Cost</span>,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
            {row.original.costPrice != null ? money(Number(row.original.costPrice)) : '—'}
          </span>
        ),
        meta: { thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'margin',
        enableSorting: false,
        header: () => <span className={HEADER}>Margin</span>,
        cell: ({ row }) => {
          const { sellingPrice, costPrice } = row.original;
          if (sellingPrice == null || costPrice == null || Number(sellingPrice) === 0)
            return <span className="text-xs text-muted-foreground/60">—</span>;

          const margin = ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100;
          return (
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                margin < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : margin < 15
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {margin.toFixed(1)}%
            </span>
          );
        },
        meta: { thClassName: 'hidden md:table-cell text-center', tdClassName: 'hidden md:table-cell text-center' },
      },
      {
        id: 'stockQuantity',
        accessorKey: 'stockQuantity',
        enableSorting: false,
        header: () => <span className={HEADER}>Stock</span>,
        cell: ({ row }) => {
          const stock = row.original.stockQuantity ?? 0;
          const threshold = row.original.lowStockThreshold;
          const low = threshold != null && stock <= threshold;

          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className={cn(
                  'text-sm tabular-nums',
                  low && 'font-semibold text-amber-600 dark:text-amber-400',
                  stock === 0 && 'text-rose-600 dark:text-rose-400'
                )}
              >
                {stock}
              </span>
              {low && (
                <Badge variant={stock === 0 ? 'rose' : 'orange'} className="gap-1 font-normal">
                  <AlertTriangle className="h-3 w-3" />
                  {stock === 0 ? 'Out' : 'Low'}
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
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium',
              row.original.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', row.original.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
            {row.original.isActive ? 'Active' : 'Retired'}
          </span>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="View in new tab">
              <Link href={viewHrefFor(row.original)} target="_blank" aria-label={`View ${row.original.name ?? row.original.sku} in a new tab`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Price history">
              <Link
                href={`/admin/product-variants/price-histories?productId=${row.original.productId}&variantId=${row.original.id}`}
                aria-label={`Price history for ${row.original.name ?? row.original.sku}`}
              >
                <History className="h-4 w-4" />
              </Link>
            </Button>
            {onEdit && row.original.isActive && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => onEdit(row.original)}
                aria-label={`Edit ${row.original.name ?? row.original.sku}`}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [onEdit]
  );
