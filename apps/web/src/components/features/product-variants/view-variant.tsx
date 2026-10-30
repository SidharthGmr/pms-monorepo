'use client';

import StatusBadge from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetAllMasterAttributes, useGetAllMasterEntries } from '@/hooks/service-hooks/useMasterEntryService';
import { useGetProductVariantById } from '@/hooks/service-hooks/useProductVariantService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantAttributeDto, ProductVariantListItemDto } from '@pms/types';
import { AlertTriangle, Boxes, ChevronLeft, History, ImageOff, IndianRupee, Pencil, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import ManageVariant from './add-edit';
import VariantRating from './variant-rating';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const money = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ViewVariantProps {
  id: number;
}

// Read-only page for one variant: media, price tiles, resolved option pairs and the ledger
// details, with editing handed to the shared ManageVariant form in a dialog.
export default function ViewVariant({ id }: ViewVariantProps) {
  const { data, isPending, isError } = useGetProductVariantById(id, id > 0);
  const variant = data?.data?.data as ProductVariantListItemDto | undefined;

  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true });
  const { data: entriesResponse } = useGetAllMasterEntries({ showAllRecords: true });

  const [activeImage, setActiveImage] = useState(0);
  const [showEdit, setShowEdit] = useState(false);

  // The stored pairs are master-data ids; the names live in the attribute/entry catalogues.
  const options = useMemo(() => {
    const attributeNames = new Map((attributesResponse?.data?.data?.data ?? []).map((attribute) => [attribute.id, attribute.name]));
    const entryValues = new Map((entriesResponse?.data?.data?.data ?? []).map((entry) => [entry.id, entry.value]));
    const pairs = Array.isArray(variant?.attributes) ? (variant?.attributes as unknown as ProductVariantAttributeDto[]) : [];
    return pairs
      .filter((pair) => pair && pair.attributeid != null)
      .map((pair) => ({
        label: attributeNames.get(pair.attributeid) ?? `Attribute #${pair.attributeid}`,
        value: entryValues.get(pair.attributeValueId) ?? `#${pair.attributeValueId}`,
      }));
  }, [variant, attributesResponse, entriesResponse]);

  if (isPending) return <ViewVariantSkeleton />;

  if (isError || !variant) {
    return (
      <Card className="py-16 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-destructive/70" />
        <p className="mt-3 text-sm font-semibold">{isError ? 'Could not load this variant' : 'Variant not found'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{isError ? 'Check your connection and try again.' : 'It may have been removed.'}</p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/admin/products/variants">Back to variants</Link>
        </Button>
      </Card>
    );
  }

  const images = variant.images ?? [];
  const title = variant.name ?? variant.sku;
  const payable = variant.isOffer && variant.offerPrice != null ? variant.offerPrice : variant.sellingPrice;
  const margin = variant.costPrice != null && variant.sellingPrice ? ((variant.sellingPrice - variant.costPrice) / variant.sellingPrice) * 100 : null;
  const lowStock = variant.lowStockThreshold != null && variant.stockQuantity <= variant.lowStockThreshold;
  const date = (value?: Date | string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as Date, true) : '—');

  const specs: { label: string; value: string; mono?: boolean }[] = [
    { label: 'SKU', value: variant.sku, mono: true },
    { label: 'Barcode', value: variant.barcode ?? '—', mono: true },
    { label: 'Product', value: variant.product?.name ?? '—' },
    ...options.map((option) => ({ label: option.label, value: option.value })),
    { label: 'Low-stock threshold', value: String(variant.lowStockThreshold ?? '—') },
    { label: 'Price effective from', value: date(variant.effectiveFrom) },
    { label: 'Price effective to', value: variant.effectiveTo ? date(variant.effectiveTo) : 'Open' },
    { label: 'Added', value: date(variant.createdAt) },
    { label: 'Last updated', value: date(variant.updatedAt) },
  ];

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground">
        <Link href={variant.product ? `/admin/products/${variant.product.id}` : '/admin/products/variants'}>
          <ChevronLeft className="h-4 w-4" />
          {variant.product ? `Back to ${variant.product.name}` : 'Back to variants'}
        </Link>
      </Button>

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="truncate">{variant.product?.name ?? '—'}</span>
              <code className="font-mono text-xs">{variant.sku}</code>
              <StatusBadge status={variant.isActive ? 'ACTIVE' : 'INACTIVE'} label={variant.isActive ? 'Active (sellable)' : 'Retired'} />
              <VariantRating variantId={variant.id} rating={variant.rating} ratingCount={variant.ratingCount} size="sm" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
              <Link href={`/admin/price-histories?productId=${variant.product?.id}&variantId=${variant.id}`}>
                <History className="h-3.5 w-3.5" />
                Price history
              </Link>
            </Button>
            <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => setShowEdit(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit variant
            </Button>
          </div>
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-2">
            {images.length ? (
              <>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[activeImage]} alt={title} className="h-full w-full object-cover" />
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
              </>
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 text-muted-foreground/60">
                <div className="rounded-full bg-muted p-3">
                  <ImageOff className="h-6 w-6" />
                </div>
                <p className="text-xs font-medium">No photos yet</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Tile
                icon={IndianRupee}
                label="Customer pays"
                value={payable != null ? money(payable) : 'Unpriced'}
                hint={
                  variant.isOffer && variant.offerPrice != null && variant.sellingPrice
                    ? `offer · was ${money(variant.sellingPrice)}`
                    : variant.costPrice != null
                      ? `cost ${money(variant.costPrice)}`
                      : undefined
                }
                warn={payable == null}
              />
              <Tile
                icon={Boxes}
                label="Stock on hand"
                value={String(variant.stockQuantity)}
                hint={lowStock ? 'at or below threshold' : undefined}
                warn={lowStock}
              />
              <Tile
                icon={TrendingUp}
                label="Margin"
                value={margin != null ? `${margin.toFixed(1)}%` : '—'}
                hint={margin != null ? 'on selling price' : 'needs cost price'}
                warn={margin != null && margin < 0}
              />
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-xl border px-4 py-3 sm:grid-cols-3">
              {specs.map((spec) => (
                <div key={spec.label} className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{spec.label}</dt>
                  <dd className={cn('mt-0.5 truncate text-sm font-semibold', spec.mono && 'font-mono text-xs leading-5')} title={spec.value}>
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>

            {variant.description && <p className="text-sm leading-relaxed text-muted-foreground">{variant.description}</p>}
          </div>
        </div>
      </Card>

      {showEdit && (
        <Dialog open onOpenChange={(open) => !open && setShowEdit(false)}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
              <DialogTitle className="truncate text-base">Edit variant</DialogTitle>
              <DialogDescription className="mt-1 text-xs">{title}</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ManageVariant id={variant.id} onCancel={() => setShowEdit(false)} onSaved={() => setShowEdit(false)} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, hint, warn }: { icon: typeof Boxes; label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <div className={cn('mt-0.5 rounded-lg p-2', warn ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-primary/10 text-primary')}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('truncate text-lg font-bold leading-tight tabular-nums', warn && 'text-rose-600 dark:text-rose-400')} title={value}>
          {value}
        </p>
        {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function ViewVariantSkeleton() {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-4 sm:px-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </Card>
  );
}
