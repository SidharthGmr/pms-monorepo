'use client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { formatPrice } from '@/lib/format-price';
import { Package } from 'lucide-react';

/** The variant's own name, else its attribute combination, e.g. "size: L · color: Red". */
const describeVariant = (variant: ProductVariantListItemDto): string => {
  if (variant.name) return variant.name;
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object') return '';
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
};

/** The variant's own photo, falling back to the product's. */
const imageFor = (variant: ProductVariantListItemDto): string | undefined => variant.images?.[0] ?? variant.product?.images?.[0];

interface VariantCardProps {
  variant: ProductVariantListItemDto;
}

export default function VariantCard({ variant }: VariantCardProps) {
  const stock = variant.stockQuantity ?? 0;
  const soldOut = stock <= 0;
  const unpriced = variant.sellingPrice == null;
  const lowStock = !soldOut && !unpriced && stock <= (variant.lowStockThreshold || 5);
  const description = describeVariant(variant);
  const image = imageFor(variant);
  const title = variant.product?.name ?? variant.sku ?? 'Product';

  return (
    <Card className="group flex flex-col overflow-hidden rounded-xl p-0 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${title}${description ? ` - ${description}` : ''}`}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-9 w-9 text-muted-foreground/30" />
          </div>
        )}
        {soldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-bold uppercase text-background">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-3">
        {variant.product?.category?.name && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{variant.product.category.name}</span>
        )}
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">{title}</h3>
        <p className="line-clamp-1 min-h-[1rem] text-[11px] text-muted-foreground">{description}</p>
        {variant.sku && <code className="font-mono text-[10px] text-muted-foreground/80">{variant.sku}</code>}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {unpriced ? (
            <span className="text-sm font-semibold text-muted-foreground">Coming soon</span>
          ) : (
            <span className="text-base font-bold tracking-tight">{formatPrice(variant.sellingPrice as number)}</span>
          )}
          {lowStock && <span className="text-[11px] font-semibold text-amber-600">Only {stock} left</span>}
        </div>
      </div>
    </Card>
  );
}

export function VariantCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden rounded-xl p-0 shadow-sm">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-2 h-5 w-20" />
      </div>
    </Card>
  );
}
