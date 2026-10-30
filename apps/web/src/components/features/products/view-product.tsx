'use client';

import StatusBadge from '@/components/common/status-badge';
import { CustomDataTable } from '@/components/Table/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import { useGetProductById } from '@/hooks/service-hooks/useProductService';
import { useGetAllProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantListItemDto, StatusValues } from '@pms/types';
import { AlertTriangle, Boxes, ChevronLeft, ExternalLink, History, ImageOff, IndianRupee, Layers, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useProductVariantColumns } from '../product-variants/columns';
import ProductViewSkeleton from '@/components/skelton/productView-Skeleton';
import ManageVariant from '../product-variants/add-edit';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const FLUSH_CARD = 'p-0 md:p-0';

const money = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ProductViewProps {
  id: number;
  onEdit?: () => void;
}
export default function ProductView({ id, onEdit }: ProductViewProps) {
  const router = useRouter();
  const { data, isPending, isError } = useGetProductById(id, id > 0);
  const product = data?.data?.data;

  const [activeImage, setActiveImage] = useState(0);
  const [showAddVariant, setShowAddVariant] = useState(false);

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
              <StatusBadge status={product.status} />
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
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setShowAddVariant(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add variant
            </Button>
          </div>
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-2">
            {images.length ? (
              <>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-muted/20">
                  <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
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
                {onEdit && (
                  <Button type="button" variant="outline" size="sm" className="mt-1 h-7 gap-1 text-xs" onClick={onEdit}>
                    <Pencil className="h-3 w-3" />
                    Add photos
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Tile
                icon={IndianRupee}
                label="Price range"
                value={low == null ? 'Unpriced' : low === high ? money(low) : `${money(low)} – ${money(high!)}`}
                hint={priced.length ? `across ${priced.length} active ${priced.length === 1 ? 'variant' : 'variants'}` : 'no active priced variant'}
                warn={low == null}
              />
              <Tile icon={Layers} label="Variants" value={String(variants.length)} hint={`${active.length} active`} />
              <Tile icon={Boxes} label="Stock on hand" value={String(stock)} hint="all variants combined" warn={stock === 0} />
            </div>

            <dl className="grid grid-cols-2 overflow-hidden rounded-xl border sm:grid-cols-3 [&>div]:border-b [&>div]:border-r [&>div:nth-child(3n)]:sm:border-r-0 [&>div:nth-child(2n)]:max-sm:border-r-0 [&>div:nth-last-child(-n+3)]:sm:border-b-0 [&>div:nth-last-child(-n+2)]:max-sm:border-b-0">
              <Spec label="Category" value={product.category?.name ?? '—'} />
              <Spec label="Brand" value={product.brandName?.name ?? '—'} />
              <Spec label="Display order" value={String(product.displayOrder ?? '—')} />
              <Spec label="Product ID" value={`#${product.id}`} mono />
              <Spec label="Added" value={date(product.createdAt)} />
              <Spec label="Last updated" value={date(product.updatedAt)} />
            </dl>

            {product.description && <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>}
          </div>
        </div>
      </Card>

      {showAddVariant && (
        <Dialog open onOpenChange={(open) => !open && setShowAddVariant(false)}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
              <DialogTitle className="truncate text-base">Add variant</DialogTitle>
              <DialogDescription className="mt-1 text-xs">A sellable version of {product.name} with its own SKU, price and stock.</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ManageVariant productId={product.id} onCancel={() => setShowAddVariant(false)} onSaved={() => setShowAddVariant(false)} />
            </div>
          </DialogContent>
        </Dialog>
      )}

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

function Tile({ icon: Icon, label, value, hint, warn }: { icon: typeof Layers; label: string; value: string; hint?: string; warn?: boolean }) {
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

function Spec({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 px-4 py-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5 truncate text-sm font-semibold', mono && 'font-mono text-xs leading-5')} title={value}>
        {value}
      </dd>
    </div>
  );
}
