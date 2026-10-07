'use client';

import CardAction from '@/components/common/card-action';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ProductVariantListItemDto } from '@pms/types';
import { AlertTriangle, Eye, History, ImageOff, Pencil } from 'lucide-react';
import Link from 'next/link';
import { imageFor, viewHrefFor } from './columns';

const money = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface AdminVariantCardProps {
  variant: ProductVariantListItemDto;
  onEdit: () => void;
  onPriceHistory: () => void;
}

// Card layout for the admin variants grid: the SKU's photo and identity up top, what it charges
// and what is on the shelf below.
export default function AdminVariantCard({ variant, onEdit, onPriceHistory }: AdminVariantCardProps) {
  const image = imageFor(variant);
  const stock = variant.stockQuantity ?? 0;
  const low = variant.lowStockThreshold != null && stock <= variant.lowStockThreshold;
  const live = variant.isOffer && variant.offerPrice != null;
  const payable = variant.sellingPrice == null ? null : live ? Number(variant.offerPrice) : Number(variant.sellingPrice);
  const savings = live && variant.sellingPrice ? Math.round((1 - Number(variant.offerPrice) / Number(variant.sellingPrice)) * 100) : 0;
  const margin =
    variant.sellingPrice != null && variant.costPrice != null && Number(variant.sellingPrice) !== 0
      ? ((Number(variant.sellingPrice) - Number(variant.costPrice)) / Number(variant.sellingPrice)) * 100
      : null;

  return (
    <Card className="group relative !p-0 overflow-hidden transition-shadow hover:shadow-md">
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <CardAction label={`View ${variant.name ?? variant.sku} in a new tab`} icon={Eye} onClick={() => window.open(viewHrefFor(variant), '_blank', 'noopener')} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label="Price history" icon={History} onClick={onPriceHistory} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label={`Edit ${variant.name ?? variant.sku}`} icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
      </div>

      <Link href={viewHrefFor(variant)} target="_blank" className="block w-full">
        <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted/40">
          {image ? (
            // Variant images come from arbitrary CDNs; next/image would need each host in
            // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={variant.name ?? variant.sku} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground/30" />
          )}
        </div>
      </Link>

      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link href={viewHrefFor(variant)} target="_blank" className="min-w-0 truncate text-left text-sm font-semibold hover:underline" title={variant.name ?? variant.sku}>
              {variant.name ?? variant.sku}
            </Link>
            <span
              className={cn(
                'mt-0.5 inline-flex shrink-0 items-center gap-1 text-[11px] font-medium',
                variant.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', variant.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
              {variant.isActive ? 'Active' : 'Retired'}
            </span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">{variant.product?.name ?? '—'}</p>
          <code className="block truncate font-mono text-[11px] text-muted-foreground/80">{variant.sku}</code>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t pt-2">
          {payable == null ? (
            <span className="text-xs text-muted-foreground/60">Unpriced</span>
          ) : (
            <>
              <span className="text-base font-bold tabular-nums">{money(payable)}</span>
              {live && <span className="text-xs tabular-nums text-muted-foreground line-through">{money(Number(variant.sellingPrice))}</span>}
              {live && savings > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{savings}% off</span>
              )}
            </>
          )}
          {margin !== null && (
            <span
              className={cn(
                'ml-auto text-[11px] font-semibold tabular-nums',
                margin < 0 ? 'text-rose-600 dark:text-rose-400' : margin < 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              )}
              title="Margin"
            >
              {margin.toFixed(1)}%
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            Stock
            <span className={cn('font-semibold tabular-nums text-foreground', low && 'text-amber-600 dark:text-amber-400', stock === 0 && 'text-rose-600 dark:text-rose-400')}>
              {stock}
            </span>
            {low && (
              <Badge variant={stock === 0 ? 'rose' : 'orange'} className="gap-1 font-normal">
                <AlertTriangle className="h-3 w-3" />
                {stock === 0 ? 'Out' : 'Low'}
              </Badge>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}
