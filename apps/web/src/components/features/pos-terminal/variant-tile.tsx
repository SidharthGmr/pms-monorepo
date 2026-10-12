'use client';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ProductVariantListItemDto } from '@pms/types';
import { ImageOff } from 'lucide-react';
import { payableOf } from './use-pos-cart';

interface VariantTileProps {
  variant: ProductVariantListItemDto;
  inCart: number;
  onAdd: (variant: ProductVariantListItemDto) => void;
}

// One tap adds one unit; the badge is the running count. Sold-out tiles stay visible but dead,
// so the cashier can answer "do you have X" without a search somewhere else.
export default function VariantTile({ variant, inCart, onAdd }: VariantTileProps) {
  const stock = variant.stockQuantity ?? 0;
  const soldOut = stock <= 0;
  const maxed = !soldOut && inCart >= stock;
  const image = variant.images?.[0];

  return (
    <button
      type="button"
      disabled={soldOut || maxed}
      onClick={() => onAdd(variant)}
      title={maxed ? 'All available stock is in the cart' : (variant.name ?? variant.sku)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all',
        soldOut
          ? 'opacity-45 grayscale'
          : maxed
            ? 'cursor-not-allowed border-amber-400/60'
            : 'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:translate-y-0 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      {inCart > 0 && (
        <span className="absolute right-1.5 top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold tabular-nums text-primary-foreground shadow ring-2 ring-background">
          {inCart}
        </span>
      )}

      <span className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-muted/60 via-muted/20 to-transparent">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground/30">
            <ImageOff className="h-6 w-6" />
          </span>
        )}
        <span
          className={cn(
            'absolute bottom-1 left-1 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide',
            soldOut ? 'bg-destructive/90 text-destructive-foreground' : stock <= (variant as { lowStockThreshold?: number }).lowStockThreshold! ? 'bg-amber-500/90 text-white' : 'bg-background/85 text-muted-foreground backdrop-blur-sm'
          )}
        >
          {soldOut ? 'Out' : `${stock} left`}
        </span>
      </span>

      <span className="flex flex-1 flex-col gap-0.5 p-2">
        <span className="line-clamp-2 text-xs font-semibold leading-snug">{variant.name}</span>
        <span className="mt-auto flex items-baseline justify-between gap-1 pt-1">
          <span className="text-sm font-bold tabular-nums text-primary">{formatPrice(payableOf(variant))}</span>
          <span className="truncate font-mono text-[9px] text-muted-foreground">{variant.sku}</span>
        </span>
      </span>
    </button>
  );
}
