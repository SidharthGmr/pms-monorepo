'use client';

import StarRating from '@/components/common/star-rating';
import WishlistToggle from '@/components/common/wishlist-toggle';
import RateProductDialog from '@/components/features/reviews/rate-product-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { useAddToCart, useGetActiveCart } from '@/hooks/service-hooks/useCartService';
import { useGetOrdersByCustomerId } from '@/hooks/service-hooks/useOrderService';
import { useGetProductById } from '@/hooks/service-hooks/useProductService';
import { useGetAllProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useGetAllReviews, useGetReviewSummary } from '@/hooks/service-hooks/useReviewService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { cn } from '@/lib/utils';
import { ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const wholeRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const withPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatPrice = (value: number): string => (Number.isInteger(value) ? wholeRupees : withPaise).format(value);

/** `{ clr: 'PNK', strg: '64GB' }` reads as "PNK · 64GB" - what tells one SKU from another. */
const describeVariant = (variant: ProductVariantListItemDto): string => {
  if (variant.name) return variant.name;
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object') return '';
  return Object.values(attributes)
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(String)
    .join(' · ');
};

interface ProductDetailProps {
  productId: number;
}

/**
 * The customer-facing product page: gallery, variant picker, add to cart, wishlist and the
 * product's published reviews. The shop grid links every card here.
 */
export default function ProductDetail({ productId }: ProductDetailProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const { data: productResponse, isLoading: isLoadingProduct, isError } = useGetProductById(productId);
  const product = productResponse?.data?.data;

  const { data: variantsResponse, isLoading: isLoadingVariants } = useGetAllProductVariants(
    { productId, isActive: true, showAllRecords: true },
    !!productId
  );
  const variants = useMemo(() => variantsResponse?.data?.data?.data ?? [], [variantsResponse]);

  const { data: summaryResponse } = useGetReviewSummary(productId);
  const summary = summaryResponse?.data?.data;

  const { data: reviewsResponse } = useGetAllReviews({ productId, recordPerPage: 10 });
  const reviews = reviewsResponse?.data?.data?.data ?? [];

  // Rating requires a purchase: the API only accepts a review against one of the caller's
  // own orders, so the stars are live only when such an order exists. Passing productId to
  // /reviews switches it to everyone's-published mode, so "my review" (whatever its
  // status) is read from the caller's own list and matched to this product here.
  const { currentUser } = useGetCurrentUser();
  const customerId = currentUser?.usersId;
  const { data: myOrdersResponse } = useGetOrdersByCustomerId(customerId ?? '', undefined, !!customerId);
  const qualifyingOrder = useMemo(
    () => (myOrdersResponse?.data?.data?.data ?? []).find((order) => order.items?.some((item) => item.productId === productId)),
    [myOrdersResponse, productId]
  );

  const { data: myReviewsResponse } = useGetAllReviews({ showAllRecords: true }, !!currentUser);
  const myReview = useMemo(
    () => (myReviewsResponse?.data?.data?.data ?? []).find((review) => review.productId === productId),
    [myReviewsResponse, productId]
  );

  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);

  const { data: cartResponse } = useGetActiveCart();
  const cartItems = cartResponse?.data?.data?.items ?? [];

  const addToCart = useAddToCart();
  const [isAdding, setIsAdding] = useState(false);

  // The first SKU that can actually be bought is preselected; without one, fall back to
  // the first variant so its "sold out"/"coming soon" state is still shown.
  const [chosenId, setChosenId] = useState<number | null>(null);
  const selected = useMemo(() => {
    if (chosenId !== null) return variants.find((variant) => variant.id === chosenId);
    return variants.find((variant) => (variant.stockQuantity ?? 0) > 0 && variant.sellingPrice != null) ?? variants[0];
  }, [variants, chosenId]);

  const gallery = useMemo(() => {
    const images = [...(selected?.images ?? []), ...(product?.images ?? [])];
    return Array.from(new Set(images));
  }, [selected, product]);
  const [imageIndex, setImageIndex] = useState(0);
  const shownImage = gallery[Math.min(imageIndex, Math.max(gallery.length - 1, 0))];

  const stock = selected?.stockQuantity ?? 0;
  const soldOut = stock <= 0;
  const unpriced = selected?.sellingPrice === null || selected?.sellingPrice === undefined;
  const inCart = selected ? (cartItems.find((item) => item.variantId === selected.id)?.quantity ?? 0) : 0;

  const handleAdd = async () => {
    if (!selected) return;
    setIsAdding(true);
    try {
      const result = await addToCart.mutateAsync({ variantIds: [selected.id] });
      if (result && (result.status === 200 || result.status === 201)) {
        toast({ variant: 'success', title: 'Added to cart', description: `${product?.name ?? selected.sku} is in your cart.` });
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
        toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{error}</span> });
      }
    } catch (error) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error as never);
      toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{message || 'Unknown error occurred'}</span> });
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoadingProduct || isLoadingVariants) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <Card className="py-16 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-semibold">Product not found</p>
        <p className="mt-1 text-xs text-muted-foreground">It may have been removed from the catalogue.</p>
        <Link href="/dashboard" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to shop
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/30">
            {shownImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownImage} alt={product.name} className="h-full w-full object-contain p-6" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
            {soldOut && (
              <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-2.5 py-1 text-[11px] font-bold uppercase text-background">
                Sold out
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  className={cn(
                    'h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted/30 transition-colors',
                    index === imageIndex ? 'border-primary ring-1 ring-primary' : 'border-border'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="space-y-5">
          <div>
            {product.category && (
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.category}</span>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={Math.round(summary?.averageRating ?? 0)} size="sm" />
              <span className="text-sm text-muted-foreground">
                {summary?.totalReviews
                  ? `${summary.averageRating.toFixed(1)} · ${summary.totalReviews} review${summary.totalReviews === 1 ? '' : 's'}`
                  : 'No reviews yet'}
              </span>
            </div>
          </div>

          <div>
            {unpriced ? (
              <span className="text-xl font-semibold text-muted-foreground">Coming soon</span>
            ) : (
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-black tracking-tight">{formatPrice(selected!.sellingPrice as number)}</span>
                {selected?.compareAtPrice != null && selected.compareAtPrice > (selected.sellingPrice ?? 0) && (
                  <span className="text-base text-muted-foreground line-through">{formatPrice(selected.compareAtPrice)}</span>
                )}
              </div>
            )}
            {!soldOut && !unpriced && stock <= (selected?.lowStockThreshold || 5) && (
              <p className="mt-1 text-sm font-semibold text-amber-600">Only {stock} left in stock</p>
            )}
          </div>

          {/* Variant picker - shown even for one variant so the chosen SKU is always visible. */}
          {variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Options</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const label = describeVariant(variant) || variant.sku || `#${variant.id}`;
                  const isSelected = selected?.id === variant.id;
                  const variantSoldOut = (variant.stockQuantity ?? 0) <= 0;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setChosenId(variant.id);
                        setImageIndex(0);
                      }}
                      className={cn(
                        'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
                        variantSoldOut && !isSelected && 'text-muted-foreground/60 line-through'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {selected?.sku && <p className="mt-2 text-xs text-muted-foreground">SKU: {selected.sku}</p>}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" className="rounded-lg px-8" disabled={!selected || soldOut || unpriced || isAdding} onClick={handleAdd}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isAdding ? 'Adding...' : soldOut ? 'Sold out' : unpriced ? 'Not yet on sale' : 'Add to cart'}
            </Button>
            <WishlistToggle productId={productId} productName={product.name} variant="button" className="h-11 rounded-lg" />
            {inCart > 0 && (
              <Link href="/dashboard/cart" className="text-sm font-medium text-primary hover:underline">
                {inCart} in cart · view
              </Link>
            )}
          </div>

          {product.description && (
            <div className="border-t border-border pt-5">
              <h2 className="mb-2 text-sm font-semibold">About this product</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold tracking-tight">Customer reviews</h2>

        {/* Rate it yourself. Live stars when a qualifying order exists; otherwise the row
            says what unlocks them instead of failing on click. */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
          {myReview ? (
            <>
              <span className="text-sm font-medium">Your rating</span>
              <StarRating value={myReview.rating} size="md" />
              <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setIsRatingOpen(true)}>
                Edit your review
              </button>
            </>
          ) : qualifyingOrder ? (
            <>
              <span className="text-sm font-medium">Rate this product</span>
              <StarRating
                value={pendingRating}
                size="md"
                onChange={(star) => {
                  setPendingRating(star);
                  setIsRatingOpen(true);
                }}
              />
              <span className="text-xs text-muted-foreground">Tap a star to write your review</span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-muted-foreground">Rate this product</span>
              <StarRating value={0} size="md" />
              <span className="text-xs text-muted-foreground">
                Available after purchase - it will unlock on <Link href="/dashboard/orders" className="text-primary hover:underline">your orders</Link>.
              </span>
            </>
          )}
        </div>

        {!summary?.totalReviews ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No reviews yet. Reviews can be written from <Link href="/dashboard/orders" className="text-primary hover:underline">your orders</Link> once
            you have purchased this product.
          </p>
        ) : (
          <div className="mt-4 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black tabular-nums">{summary.averageRating.toFixed(1)}</span>
                <div>
                  <StarRating value={Math.round(summary.averageRating)} size="sm" />
                  <p className="text-xs text-muted-foreground">{summary.totalReviews} review{summary.totalReviews === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.ratingCounts?.[String(star)] ?? 0;
                  const share = summary.totalReviews ? (count / summary.totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 tabular-nums text-muted-foreground">{star}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${share}%` }} />
                      </div>
                      <span className="w-6 text-right tabular-nums text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <StarRating value={review.rating} size="sm" />
                      <span className="text-sm font-semibold">{review.user?.name ?? 'Customer'}</span>
                      {review.isVerified && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Verified purchase</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  {review.title && <p className="mt-2 text-sm font-semibold">{review.title}</p>}
                  {review.comment && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isRatingOpen && (myReview || qualifyingOrder) && (
        <RateProductDialog
          orderId={myReview?.orderId ?? qualifyingOrder!.id}
          productId={productId}
          productName={product.name}
          reviewId={myReview?.id}
          initialRating={myReview?.rating ?? pendingRating}
          initialTitle={myReview?.title}
          initialComment={myReview?.comment}
          isOpen={isRatingOpen}
          onClose={() => {
            setIsRatingOpen(false);
            setPendingRating(0);
          }}
        />
      )}
    </div>
  );
}
