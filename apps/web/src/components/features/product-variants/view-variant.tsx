'use client';

import VariantPriceTable from '@/components/features/price-histories/variant-price-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetProductVariantById } from '@/hooks/service-hooks/useProductVariantService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantListItemDto } from '@pms/types';
import { AlertTriangle, ChevronLeft, ExternalLink, History, ImageOff, Pencil } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useState } from 'react';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const money = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const attributesOf = (variant: ProductVariantListItemDto): { key: string; value: string }[] => {
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return [];
  return Object.entries(attributes).map(([key, value]) => ({ key, value: String(value) }));
};

interface VariantViewProps {
  id: number;
  /** When given, Edit opens the form on this page instead of navigating to it. */
  onEdit?: () => void;
}

// Read-only view of one SKU, opened from the list in its own tab so the list is never lost.
// Everything here comes from the detail endpoint.
export default function VariantView({ id, onEdit }: VariantViewProps) {
  const { data, isPending, isError } = useGetProductVariantById(id);
  const variant = data?.data?.data as ProductVariantListItemDto | undefined;

  const [activeImage, setActiveImage] = useState(0);

  if (isPending) return <VariantViewSkeleton />;

  if (isError || !variant) {
    return (
      <Card className="py-16 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-destructive/70" />
        <p className="mt-3 text-sm font-semibold">{isError ? 'Could not load this variant' : 'Variant not found'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{isError ? 'Check your connection and try again.' : 'It may have been removed.'}</p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/admin/product-variants">Back to variants</Link>
        </Button>
      </Card>
    );
  }

  const images = variant.images?.length ? variant.images : variant.product?.images?.length ? variant.product.images : [];
  const stock = variant.stockQuantity ?? 0;
  const low = variant.lowStockThreshold != null && stock <= variant.lowStockThreshold;
  const live = variant.isOffer && variant.offerPrice != null;
  const payable = variant.sellingPrice == null ? null : live ? Number(variant.offerPrice) : Number(variant.sellingPrice);
  const savings = live && variant.sellingPrice ? Math.round((1 - Number(variant.offerPrice) / Number(variant.sellingPrice)) * 100) : 0;
  const margin =
    variant.sellingPrice != null && variant.costPrice != null && Number(variant.sellingPrice) !== 0
      ? ((Number(variant.sellingPrice) - Number(variant.costPrice)) / Number(variant.sellingPrice)) * 100
      : null;
  const attributes = attributesOf(variant);

  const date = (value?: Date | string | null, withTime = true) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as Date, withTime) : '—');

  return (
    <div className="space-y-4">
      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{variant.name ?? variant.sku}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="truncate">{variant.product?.name ?? '—'}</span>
              <code className="font-mono text-xs">{variant.sku}</code>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-medium',
                  variant.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', variant.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
                {variant.isActive ? 'Active' : 'Retired'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {variant.isActive && (
              <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
                <a href={`/products/${encodeURIComponent(variant.sku)}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in store
                </a>
              </Button>
            )}
            <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
              <Link href={`/admin/product-variants/price-histories?productId=${variant.product?.id}&variantId=${variant.id}`}>
                <History className="h-3.5 w-3.5" />
                Price history
              </Link>
            </Button>
            {onEdit ? (
              <Button type="button" size="sm" className="h-9 gap-1.5" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit variant
              </Button>
            ) : (
              <Button asChild type="button" size="sm" className="h-9 gap-1.5">
                <Link href={`/admin/product-variants/${variant.id}`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit variant
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
              {images[activeImage] ? (
                // Variant images come from arbitrary CDNs; next/image would need each host in
                // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[activeImage]} alt={variant.name ?? variant.sku} className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-10 w-10 text-muted-foreground/30" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Photo ${index + 1}`}
                    className={cn('h-14 w-14 shrink-0 overflow-hidden rounded-lg border', index === activeImage && 'ring-2 ring-primary')}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border bg-muted/30 p-4">
              {payable == null ? (
                <p className="text-sm text-muted-foreground">Unpriced — record a price to make this sellable.</p>
              ) : (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">{money(payable)}</span>
                  {live && <span className="text-sm tabular-nums text-muted-foreground line-through">{money(Number(variant.sellingPrice))}</span>}
                  {live && savings > 0 && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{savings}% off</span>
                  )}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Cost <span className="font-semibold text-foreground">{variant.costPrice != null ? money(Number(variant.costPrice)) : '—'}</span>
                </span>
                {margin !== null && (
                  <span>
                    Margin{' '}
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        margin < 0 ? 'text-rose-600 dark:text-rose-400' : margin < 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {margin.toFixed(1)}%
                    </span>
                  </span>
                )}
                {!variant.isOffer && variant.offerPrice != null && <span>Offer {money(Number(variant.offerPrice))} staged</span>}
              </div>
            </div>

            <dl className="grid gap-x-8 sm:grid-cols-2">
              <Field
                label="Stock on hand"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('tabular-nums', low && 'font-semibold text-amber-600 dark:text-amber-400', stock === 0 && 'text-rose-600 dark:text-rose-400')}>{stock}</span>
                    {low && (
                      <Badge variant={stock === 0 ? 'rose' : 'orange'} className="gap-1 font-normal">
                        <AlertTriangle className="h-3 w-3" />
                        {stock === 0 ? 'Out' : 'Low'}
                      </Badge>
                    )}
                  </span>
                }
              />
              <Field label="Low-stock alert at" value={variant.lowStockThreshold ?? '—'} />
              <Field label="Barcode" value={variant.barcode ? <code className="font-mono text-xs">{variant.barcode}</code> : '—'} />
              <Field label="Rating" value={variant.rating != null ? `${variant.rating.toFixed(1)} (${variant.ratingCount ?? 0})` : 'Not rated yet'} />
              <Field label="Added" value={date(variant.createdAt)} />
              <Field label="Last updated" value={date(variant.updatedAt)} />
            </dl>

            {attributes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attributes.map(({ key, value }) => (
                  <Badge key={key} variant="zinc" className="font-normal">
                    <span className="uppercase text-muted-foreground">{key}</span>
                    <span className="mx-1">·</span>
                    <span className="font-medium">{value}</span>
                  </Badge>
                ))}
              </div>
            )}

            {variant.description && <p className="border-t pt-4 text-sm leading-relaxed text-muted-foreground">{variant.description}</p>}
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <History className="h-3.5 w-3.5 text-primary" />
          Price history
        </h2>
        <VariantPriceTable variantId={variant.id} />
      </div>
    </div>
  );
}

export function VariantViewBackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground">
      <Link href="/admin/product-variants">
        <ChevronLeft className="h-4 w-4" />
        Back to variants
      </Link>
    </Button>
  );
}

function VariantViewSkeleton() {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-4 sm:px-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed py-2 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
