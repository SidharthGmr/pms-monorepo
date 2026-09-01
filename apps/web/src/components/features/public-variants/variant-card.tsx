'use client';
import WishlistToggle from '@/components/common/wishlist-toggle';
import VariantRating from '@/components/features/product-variants/variant-rating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useAddToCart } from '@/hooks/service-hooks/useCartService';
import { useGetAllWishlists } from '@/hooks/service-hooks/useWishlistService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantListItemDto } from '@pms/types';
import { ImageOff, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';

const attributesOf = (variant: ProductVariantListItemDto): { key: string; value: string }[] => {
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object') return [];
  return Object.entries(attributes).map(([key, value]) => ({ key, value: String(value) }));
};

const imageFor = (variant: ProductVariantListItemDto): string | undefined => variant.images?.[0] ?? variant.product?.name?.[0];

interface VariantCardProps {
  variant: ProductVariantListItemDto;
}

export default function VariantCard({ variant }: VariantCardProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const addToCart = useAddToCart();

  const stock = variant.stockQuantity ?? 0;
  const soldOut = stock <= 0;
  const unpriced = variant.sellingPrice == null;
  const lowStock = !soldOut && stock <= (variant.lowStockThreshold || 5);

  // Mirrors the API's `payablePrice`: the offer amount only counts while the flag is on, so a
  // staged offerPrice with isOffer off still shows - and charges - the list price.
  const onOffer = variant.isOffer === true && variant.offerPrice != null && variant.sellingPrice != null;
  const payable = onOffer ? (variant.offerPrice as number) : variant.sellingPrice;
  const discountPercent = onOffer ? Math.round((1 - (variant.offerPrice as number) / (variant.sellingPrice as number)) * 100) : 0;
  const attributes = attributesOf(variant);
  const image = imageFor(variant);
  const title = variant.product?.name ?? variant.sku ?? 'Product';
  const subtitle = attributes.length === 0 ? variant.name : null;

  const { currentUser } = useGetCurrentUser();
  const userId = (currentUser as { userId?: string } | undefined)?.userId;
  const { data: wishlistResponse } = useGetAllWishlists({ userId, showAllRecords: true }, !!userId);

  const wishlistedVariantIds = useMemo(
    () => new Set((wishlistResponse?.data?.data?.data ?? []).map((entry) => entry.variantId).filter((id): id is number => id !== null)),
    [wishlistResponse]
  );

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
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 !p-0 shadow-none transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      <div className="relative h-40 overflow-hidden bg-muted/40">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            loading="lazy"
            className={cn(
              'h-full w-full object-contain   p-4 transition-transform duration-500 ease-out group-hover:scale-105',
              soldOut && 'opacity-35 grayscale'
            )}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/25">
            <ImageOff className="h-7 w-7" />
            <span className="text-[10px] font-medium uppercase tracking-wide">No image</span>
          </div>
        )}

        {soldOut ? (
          <Badge variant="zinc" className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm">
            Sold out
          </Badge>
        ) : (
          onOffer && (
            <Badge variant="rose" className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm">
              {discountPercent > 0 ? `${discountPercent}% off` : 'Offer'}
            </Badge>
          )
        )}

        <div className="absolute right-2 top-2 z-10">
          <WishlistToggle
            variantId={variant.id}
            productName={title}
            inWishlist={wishlistedVariantIds.has(variant.id)}
            className="rounded-full bg-background/70 shadow-sm backdrop-blur transition-colors hover:bg-background"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        {/* {(variant.product?.category?.name || variant.sku) && (
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {variant.product?.category?.name && <span className="truncate">{variant.product.category.name}</span>}
            {variant.product?.category?.name && variant.sku && <span className="text-muted-foreground/40">·</span>}
            {variant.sku && <span className="truncate font-mono normal-case tracking-normal text-muted-foreground/70">{variant.sku}</span>}
          </div>
        )} */}

        <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight" title={title}>
          {title}
        </CardTitle>

        {/* Values only - "size:"/"color:" doubles the width of every chip on a narrow card,
            and the key is still there on hover for anyone who needs it. */}
        {attributes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {attributes.map(({ key, value }) => (
              <span
                key={key}
                title={`${key}: ${value}`}
                className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium capitalize leading-4 text-foreground/80"
              >
                {value}
              </span>
            ))}
          </div>
        )}
        {subtitle && <CardDescription className="mt-2 line-clamp-1 text-muted-foreground">{subtitle}</CardDescription>}

        <div className="mt-2.5">
          <VariantRating variantId={variant.id} rating={variant.rating} ratingCount={variant.ratingCount} />
        </div>

        {/* Pinned to the bottom so price and the CTA line up across a row of uneven cards. */}
        <div className="mt-auto pt-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            {unpriced ? (
              <span className="text-sm font-medium text-muted-foreground">Coming soon</span>
            ) : (
              <span className="flex items-baseline gap-1.5">
                <span className="text-[19px] font-bold leading-none tracking-tight">{formatPrice(payable as number)}</span>
                {/* The list price stays visible while an offer runs, so the saving is legible. */}
                {onOffer && (
                  <span className="text-[11px] font-medium leading-none text-muted-foreground line-through">
                    {formatPrice(variant.sellingPrice as number)}
                  </span>
                )}
              </span>
            )}
            {!soldOut && lowStock && <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-500">Only {stock} left</span>}
            {!soldOut && !lowStock && <span className="text-[11px] font-medium text-muted-foreground">{stock} in stock</span>}
          </div>

          <Button
            type="button"
            size="sm"
            className="h-9 w-full rounded-lg"
            icon={ShoppingCart}
            iconPlacement="left"
            loading={addToCart.isPending}
            disabled={soldOut || unpriced || addToCart.isPending}
            onClick={handleAdd}
          >
            {soldOut ? 'Sold out' : unpriced ? 'Unavailable' : 'Add to cart'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function VariantCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 p-0 shadow-none">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col p-3.5">
        <Skeleton className="mb-1 h-2.5 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-1.5 h-4 w-1/2" />
        <div className="mt-2 flex gap-1">
          <Skeleton className="h-4 w-10 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-2.5 h-4 w-28" />
        <div className="mt-auto pt-3">
          <div className="mb-2 flex items-baseline justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    </Card>
  );
}
