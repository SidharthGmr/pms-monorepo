'use client';

import { CustomDataTable } from '@/components/Table/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetProductById } from '@/hooks/service-hooks/useProductService';
import { useGetAllProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantListItemDto } from '@pms/types';
import { AlertTriangle, ChevronLeft, ExternalLink, History, ImageOff, Layers, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import { useProductVariantColumns } from '../product-variants/columns';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';

const money = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  [StatusValues.Published]: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  [StatusValues.Draft]: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  [StatusValues.Trash]: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
};

interface ProductViewProps {
  id: number;
  onEdit?: () => void;
}
export default function ProductView({ id, onEdit }: ProductViewProps) {
  const router = useRouter();
  const { data, isPending, isError } = useGetProductById(id, id > 0);
  const product = data?.data?.data;

  const [activeImage, setActiveImage] = useState(0);

  const variantQuery = useGetAllProductVariants({ productId: id, recordPerPage: 100 }, id > 0);
  const variants: ProductVariantListItemDto[] = useMemo(() => variantQuery.data?.data?.data?.data ?? [], [variantQuery.data]);

  const columns = useProductVariantColumns((variant) => router.push(`/admin/products/variants/${variant.id}?edit=1`));
  const table = useCustomDataTable({
    columns,
    data: variants,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: 1,
    pagination: { pageIndex: 0, pageSize: Math.max(variants.length, 1) },
    sorting: [],
  });

  if (isPending) return <ProductViewSkeleton />;

  if (isError || !product) {
    return (
      <Card className="py-16 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-destructive/70" />
        <p className="mt-3 text-sm font-semibold">{isError ? 'Could not load this product' : 'Product not found'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{isError ? 'Check your connection and try again.' : 'It may have been removed.'}</p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/admin/products">Back to products</Link>
        </Button>
      </Card>
    );
  }

  const images = product.images ?? [];
  const tone = STATUS_TONE[product.status] ?? { dot: 'bg-muted-foreground', text: 'text-muted-foreground' };
  const active = variants.filter((variant) => variant.isActive);
  const stock = variants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0);
  const priced = active
    .map((variant) => Number(variant.isOffer && variant.offerPrice != null ? variant.offerPrice : variant.sellingPrice))
    .filter((value) => Number.isFinite(value));
  const low = priced.length ? Math.min(...priced) : null;
  const high = priced.length ? Math.max(...priced) : null;

  const date = (value?: Date | string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as Date, true) : '—');

  return (
    <div className="space-y-4">
      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{product.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="truncate">{product.category?.name ?? '—'}</span>
              {product.brandName?.name && <span className="truncate">· {product.brandName.name}</span>}
              <code className="font-mono text-xs">/{product.slug}</code>
              <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone.text)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                {product.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {product.status === StatusValues.Published && (
              <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
                <a href={`/products?search=${encodeURIComponent(product.name)}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in store
                </a>
              </Button>
            )}
            <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
              <Link href={`/admin/product-variants/price-histories?productId=${product.id}`}>
                <History className="h-3.5 w-3.5" />
                Price history
              </Link>
            </Button>
            {onEdit ? (
              <Button type="button" size="sm" className="h-9 gap-1.5" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit product
              </Button>
            ) : (
              <Button asChild type="button" size="sm" className="h-9 gap-1.5">
                <Link href={`/admin/products/${product.id}`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit product
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
              {images[activeImage] ? (
                // Product images come from arbitrary CDNs; next/image would need each host in
                // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
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
            <div className="grid gap-3 sm:grid-cols-3">
              <Tile
                label="Price range"
                value={low == null ? 'Unpriced' : low === high ? money(low) : `${money(low)} – ${money(high!)}`}
                hint={priced.length ? `across ${priced.length} active ${priced.length === 1 ? 'variant' : 'variants'}` : 'no active priced variant'}
              />
              <Tile label="Variants" value={String(variants.length)} hint={`${active.length} active`} />
              <Tile label="Stock on hand" value={String(stock)} hint="all variants combined" warn={stock === 0} />
            </div>

            <dl className="grid gap-x-8 sm:grid-cols-2">
              <Field label="Category" value={product.category?.name ?? '—'} />
              <Field label="Brand" value={product.brandName?.name ?? '—'} />
              <Field label="Attribute" value={product.attribute?.name ?? '—'} />
              <Field label="Display order" value={product.displayOrder ?? '—'} />
              <Field label="Product ID" value={<span className="font-mono text-xs">{product.id}</span>} />
              <Field label="Slug" value={<span className="font-mono text-xs">{product.slug}</span>} />
              <Field label="Added" value={date(product.createdAt)} />
              <Field label="Last updated" value={date(product.updatedAt)} />
            </dl>

            {product.description && <p className="border-t pt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>}
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Variants
            {!variantQuery.isPending && <span className="font-normal normal-case tracking-normal">({variants.length})</span>}
          </h2>
          <Button asChild type="button" variant="outline" size="sm" className="h-8 gap-1.5">
            <Link href={`/admin/product-variants/add?productId=${product.id}`}>
              <Plus className="h-3.5 w-3.5" />
              Add variant
            </Link>
          </Button>
        </div>

        {variantQuery.isError ? (
          <Card className="py-10 text-center">
            <p className="text-sm font-semibold text-destructive">Could not load this product&apos;s variants</p>
            <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
          </Card>
        ) : (
          <Card className={cn(FLUSH_CARD, 'overflow-hidden')}>
            <CustomDataTable
              columns={columns}
              table={table}
              isLoading={variantQuery.isPending}
              flush
              emptyMessage={
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <Layers className="h-6 w-6 text-muted-foreground/40" />
                  <span className="text-sm">No variants yet. A product needs one with a price before it can be sold.</span>
                </div>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export function ProductViewBackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground">
      <Link href="/admin/products">
        <ChevronLeft className="h-4 w-4" />
        Back to products
      </Link>
    </Button>
  );
}

function ProductViewSkeleton() {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-4 sm:px-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </Card>
  );
}

function Tile({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 truncate text-lg font-bold tabular-nums', warn && 'text-rose-600 dark:text-rose-400')} title={value}>
        {value}
      </p>
      {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
    </div>
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
