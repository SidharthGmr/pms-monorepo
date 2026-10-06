'use client';
import WishlistToggle from '@/components/common/wishlist-toggle';
import VariantRating from '@/components/features/product-variants/variant-rating';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useAddToCart, useCartMembership } from '@/hooks/service-hooks/useCartService';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useGetAllWishlists } from '@/hooks/service-hooks/useWishlistService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantListItemDto } from '@pms/types';
import { Check, ImageOff, PackageSearch, PackageX, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const attributesOf = (variant: ProductVariantListItemDto): { key: string; value: string }[] => {
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return [];
  return Object.entries(attributes).map(([key, value]) => ({ key, value: String(value) }));
};

const imagesOf = (variant: ProductVariantListItemDto): string[] => (variant.images?.length ? variant.images : (variant.product?.images ?? []));

const optionLabel = (variant: ProductVariantListItemDto): string => {
  const values = attributesOf(variant).map((a) => a.value);
  return values.length > 0 ? values.join(' / ') : (variant.name ?? variant.sku);
};

const formatDate = (value: Date | string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

interface VariantDetailProps {
  sku: string;
}

// The public list route is the only unauthenticated variant endpoint, so the page asks it for
// exactly one row by SKU. Loading, error and not-found are resolved here; the view below only
// ever receives a real variant so its hooks can run unconditionally.
export default function VariantDetail({ sku }: VariantDetailProps) {
  const { data, isLoading, isError, refetch } = useGetAllPublicProductVariants({ sku, page: 1, recordPerPage: 1 }, sku.length > 0);
  const variant = data?.data?.data?.data?.[0];

  if (isLoading) return <VariantDetailSkeleton />;

  if (isError) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <PackageX className="h-8 w-8 text-destructive/70" />
          <p className="text-sm text-muted-foreground">Could not load this product right now.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  if (!variant) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="rounded-full bg-primary/10 p-3 text-primary">
            <PackageSearch className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">We couldn&apos;t find that product</p>
            <p className="text-sm text-muted-foreground">
              Nothing is on sale with the SKU <span className="font-mono">{sku}</span>.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/products">Browse all products</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return <VariantDetailView variant={variant} />;
}

interface VariantDetailViewProps {
  variant: ProductVariantListItemDto;
}

function VariantDetailView({ variant }: VariantDetailViewProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const addToCart = useAddToCart();
  const pathname = usePathname();

  const images = imagesOf(variant);
  const [activeImage, setActiveImage] = useState(0);
  useEffect(() => setActiveImage(0), [variant.id]);
  const image = images[activeImage] ?? images[0];

  const title = variant.product?.name ?? variant.sku;
  const category = variant.product?.category?.name ?? null;
  const attributes = attributesOf(variant);

  const stock = variant.stockQuantity ?? 0;
  const soldOut = stock <= 0;
  const unpriced = variant.sellingPrice == null;
  const lowStock = !soldOut && stock <= (variant.lowStockThreshold || 5);

  // Mirrors the API's `payablePrice`: the offer only counts while the flag is on.
  const onOffer = variant.isOffer === true && variant.offerPrice != null && variant.sellingPrice != null;
  const payable = onOffer ? (variant.offerPrice as number) : variant.sellingPrice;
  const discountPercent = onOffer ? Math.round((1 - (variant.offerPrice as number) / (variant.sellingPrice as number)) * 100) : 0;

  const { currentUser } = useGetCurrentUser();
  const userId = (currentUser as { userId?: string } | undefined)?.userId;
  const { data: wishlistResponse } = useGetAllWishlists({ userId, showAllRecords: true }, !!userId);
  const inWishlist = useMemo(
    () => (wishlistResponse?.data?.data?.data ?? []).some((entry) => entry.variantId === variant.id),
    [wishlistResponse, variant.id]
  );

  const cart = useCartMembership(!!userId);
  const inCart = cart.variantIds.has(variant.id);
  const cartHref = pathname?.startsWith('/dashboard') ? '/dashboard/cart' : '/admin/cart';

  // Sibling variants of the same product (sizes, colours) so the shopper can switch without going back.
  const { data: siblingResponse } = useGetAllPublicProductVariants({ productId: variant.product.id, showAllRecords: true, sortBy: 'sku', sortDirection: 'ASC' });
  const siblings = useMemo(() => siblingResponse?.data?.data?.data ?? [], [siblingResponse]);

  const handleAdd = async () => {
    const result = await addToCart.mutateAsync({ variantIds: [variant.id] });
    if (result && (result.status === 200 || result.status === 201)) {
      toast({ variant: 'success', title: 'Added to cart', description: <span>{title} is in your cart.</span> });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{error}</span> });
    }
  };

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {category && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/products?categoryIds=${variant.product.categoryId}`}>{category}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <Card className="relative overflow-hidden rounded-2xl border border-border/60 !p-0 shadow-none">
            <div className="relative aspect-square bg-muted/40">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={title} className={cn('h-full w-full object-contain p-8', soldOut && 'opacity-35 grayscale')} />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/25">
                  <ImageOff className="h-10 w-10" />
                  <span className="text-xs font-medium uppercase tracking-wide">No image</span>
                </div>
              )}

              {soldOut ? (
                <Badge variant="zinc" className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm">
                  Sold out
                </Badge>
              ) : (
                onOffer && (
                  <Badge variant="rose" className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm">
                    {discountPercent > 0 ? `${discountPercent}% off` : 'Offer'}
                  </Badge>
                )
              )}

              <div className="absolute right-3 top-3 z-10">
                <WishlistToggle
                  variantId={variant.id}
                  productName={title}
                  inWishlist={inWishlist}
                  className="rounded-full bg-background/70 shadow-sm backdrop-blur transition-colors hover:bg-background"
                />
              </div>
            </div>
          </Card>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={index === activeImage}
                  className={cn(
                    'h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-muted/40 transition-colors',
                    index === activeImage ? 'border-primary ring-2 ring-primary/20' : 'border-border/60 hover:border-border'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {category && (
                <Badge variant="outline" className="rounded-full font-medium">
                  {category}
                </Badge>
              )}
              <span className="font-mono">SKU {variant.sku}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {variant.name && attributes.length === 0 && <p className="text-sm text-muted-foreground">{variant.name}</p>}
            <VariantRating variantId={variant.id} rating={variant.rating} ratingCount={variant.ratingCount} size="md" />
          </div>

          <div className="space-y-1">
            {unpriced ? (
              <p className="text-lg font-medium text-muted-foreground">Coming soon</p>
            ) : (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold leading-none tracking-tight">{formatPrice(payable as number)}</span>
                {onOffer && (
                  <>
                    <span className="text-sm font-medium text-muted-foreground line-through">{formatPrice(variant.sellingPrice as number)}</span>
                    <span className="text-sm font-semibold text-rose-600">Save {formatPrice((variant.sellingPrice as number) - (variant.offerPrice as number))}</span>
                  </>
                )}
              </div>
            )}
            {soldOut ? (
              <p className="text-sm font-medium text-muted-foreground">Currently out of stock</p>
            ) : lowStock ? (
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-500">Only {stock} left, order soon</p>
            ) : (
              <p className="text-sm font-medium text-green-700 dark:text-green-500">In stock</p>
            )}
          </div>

          {attributes.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              {attributes.map(({ key, value }) => (
                <div key={key} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{key}</dt>
                  <dd className="font-semibold capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {siblings.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Other options</p>
              <div className="flex flex-wrap gap-2">
                {siblings.map((sibling) => {
                  const current = sibling.id === variant.id;
                  return (
                    <Link
                      key={sibling.id}
                      href={`/products/${encodeURIComponent(sibling.sku)}`}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        current ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 bg-background hover:border-primary hover:text-primary',
                        sibling.stockQuantity <= 0 && !current && 'text-muted-foreground line-through'
                      )}
                    >
                      {optionLabel(sibling)}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row">
            {inCart ? (
              <Button asChild variant="outline" size="lg" className="h-12 flex-1 rounded-xl border-green-600/40 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800">
                <Link href={cartHref} aria-label={`${title} is in your cart. View cart`}>
                  <Check className="h-4 w-4" />
                  In cart · {cart.quantityOfVariant(variant.id)}
                  <span className="ml-auto text-sm font-medium underline-offset-2 hover:underline">View cart</span>
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="h-12 flex-1 rounded-xl"
                icon={ShoppingCart}
                iconPlacement="left"
                loading={addToCart.isPending}
                disabled={soldOut || unpriced || addToCart.isPending}
                onClick={handleAdd}
              >
                {soldOut ? 'Sold out' : unpriced ? 'Unavailable' : 'Add to cart'}
              </Button>
            )}
            <WishlistToggle variantId={variant.id} productName={title} inWishlist={inWishlist} variant="button" className="h-12 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border border-border/60 shadow-none lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Description</h2>
          {variant.description ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{variant.description}</p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No description has been added for this product yet.</p>
          )}
        </Card>

        <Card className="rounded-2xl border border-border/60 shadow-none">
          <h2 className="text-base font-semibold tracking-tight">Details</h2>
          <dl className="mt-3 divide-y divide-border/60 text-sm">
            <DetailRow label="SKU" value={variant.sku} mono />
            <DetailRow label="Barcode" value={variant.barcode ?? '—'} mono />
            <DetailRow label="Product" value={variant.product?.name ?? '—'} />
            <DetailRow label="Category" value={category ?? '—'} />
            <DetailRow label="Availability" value={soldOut ? 'Out of stock' : `${stock} in stock`} />
            {onOffer && variant.effectiveTo && <DetailRow label="Offer ends" value={formatDate(variant.effectiveTo)} />}
            <DetailRow label="Listed on" value={formatDate(variant.createdAt)} />
          </dl>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn('text-right font-medium', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}

export function VariantDetailSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading product" aria-busy="true">
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-40" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}
