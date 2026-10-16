'use client';
import { Card } from '@/components/ui/card';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { CatalogProductDto } from '@pms/types';
import { ImageOff, Star } from 'lucide-react';
import Link from 'next/link';

/**
 * One catalog tile. Everything shown is already derived by the API - payable price, stock,
 * resolved attribute values - so this stays a pure render. The swatch row is the colours of
 * the variants that matched the current filter, which doubles as "what did I just filter to".
 */
export default function CatalogProductCard({ product }: { product: CatalogProductDto }) {
  const { formatCurrency } = useLocale();

  const cover = product.variants.find((variant) => variant.images?.length)?.images?.[0] ?? product.images?.[0];
  const anyInStock = product.variants.some((variant) => variant.inStock);
  const onOffer = product.variants.some((variant) => variant.isOffer && variant.offerPrice != null);
  const compareAt = product.variants.find((variant) => variant.isOffer && variant.compareAtPrice != null)?.compareAtPrice ?? null;
  const swatches = Array.from(new Map(product.variants.flatMap((variant) => variant.attributes).filter((attribute) => attribute.colorHex).map((attribute) => [attribute.entryId, attribute])).values());
  const href = `/products/${encodeURIComponent(product.slug)}`;

  const price =
    product.minPrice == null
      ? 'Price on request'
      : product.minPrice === product.maxPrice
        ? formatCurrency(product.minPrice)
        : `${formatCurrency(product.minPrice)} – ${formatCurrency(product.maxPrice ?? product.minPrice)}`;

  return (
    <Link href={href} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md md:p-0">
        <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <ImageOff className="h-8 w-8 text-muted-foreground/40" />
            </span>
          )}
          <span className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {onOffer && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Offer</span>}
            {product.isFeatured && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Featured</span>}
          </span>
          {!anyInStock && (
            <span className="absolute inset-x-0 bottom-0 bg-background/90 py-1 text-center text-[11px] font-semibold text-destructive">Out of stock</span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{product.brandName ?? product.categoryName}</span>
          <span className="line-clamp-2 text-sm font-semibold leading-snug" title={product.name}>
            {product.name}
          </span>

          <span className="mt-auto flex items-center justify-between gap-2 pt-1.5">
            <span className="min-w-0">
              <span className={cn('block truncate text-sm font-bold tabular-nums', onOffer && 'text-rose-600 dark:text-rose-400')}>{price}</span>
              {compareAt != null && <span className="block text-[11px] tabular-nums text-muted-foreground line-through">{formatCurrency(compareAt)}</span>}
            </span>
            {product.rating != null && (
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </span>

          <span className="flex items-center justify-between gap-2 pt-1">
            <span className="flex items-center gap-1">
              {swatches.slice(0, 5).map((swatch) => (
                <span key={swatch.entryId} title={swatch.value} className="h-3.5 w-3.5 rounded-full border border-border/70" style={{ backgroundColor: swatch.colorHex ?? undefined }} />
              ))}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {product.variants.length === product.totalVariants
                ? `${product.totalVariants} variant${product.totalVariants === 1 ? '' : 's'}`
                : `${product.variants.length} of ${product.totalVariants} variants`}
            </span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
