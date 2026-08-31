'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useAddToCart } from '@/hooks/service-hooks/useCartService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { formatPrice } from '@/lib/format-price';
import VariantRating from '@/components/features/product-variants/variant-rating';
import RateVariantButton from '@/components/features/product-variants/rate-variant-button';
import { Package, ShoppingCart } from 'lucide-react';
import WishlistToggle from '@/components/common/wishlist-toggle';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { useGetAllWishlists } from '@/hooks/service-hooks/useWishlistService';
import { useMemo } from 'react';

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
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const addToCart = useAddToCart();

  const stock = variant.stockQuantity ?? 0;
  const soldOut = stock <= 0;
  const unpriced = variant.sellingPrice == null;
  const lowStock = !soldOut && !unpriced && stock <= (variant.lowStockThreshold || 5);
  const description = describeVariant(variant);
  const image = imageFor(variant);
  const title = variant.product?.name ?? variant.sku ?? 'Product';

  const handleAdd = async () => {
    try {
      // Variant-keyed: the shopper picked this exact SKU, so the API must not fall back
      // to the product's first active variant.
      const result = await addToCart.mutateAsync({ variantIds: [variant.id] });

      if (result && (result.status === 200 || result.status === 201)) {
        toast({ variant: 'success', title: 'Added to cart', description: <span>{title} is in your cart.</span> });
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
        toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{message || 'Unknown error occurred'}</span> });
    }
  };

  const { currentUser } = useGetCurrentUser();
  // `session.user` is the login payload, which carries both `userId` (the column) and the
  // `usersId` alias UserDto declares. `userId` is the one the API filters on.
  const userId = (currentUser as { userId?: string } | undefined)?.userId;
  // Scoped to this user on purpose: the API only pins a *non-staff* caller to their own
  // list, so an admin asking without a userId would get every user's saves back.
  const { data: wishlistResponse } = useGetAllWishlists({ userId, showAllRecords: true }, !!userId);

  // Matched on variantId, not productId: this grid shows one card per SKU, so saving the
  // "L" must fill only the L card. Product-level saves have a null variantId and are
  // deliberately not matched here - they belong to the product pages.
  const wishlistedVariantIds = useMemo(
    () => new Set((wishlistResponse?.data?.data?.data ?? []).map((entry) => entry.variantId).filter((id): id is number => id !== null)),
    [wishlistResponse]
  );

  // A wishlist row still carries the parent product (the FK and the store scope come from
  // it), so the heart needs both ids - the variant alone cannot be filed.
  const productId = variant.product?.id;

  return (
    <Card className="group flex flex-col overflow-hidden rounded-xl p-0 shadow-sm transition-shadow hover:shadow-md">
      {/* <div className="absolute left-3 top-3">{badge}</div> */}
      {/* Above the sold-out scrim so the heart stays usable on an unavailable product. */}
      {productId}/{variant?.id}
      {productId !== undefined && (
        <div className="absolute right-2 top-2 z-10">
          <WishlistToggle
            productId={productId}
            variantId={variant.id}
            productName={title}
            inWishlist={wishlistedVariantIds.has(variant.id)}
            className="rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background"
          />
        </div>
      )}
      {/* {soldOut && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />} */}
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

        {/* Read-only here: the storefront grid is public, and rating needs a signed-in user. */}
        <VariantRating variantId={variant.id} rating={variant.rating} ratingCount={variant.ratingCount} className="mt-1" />
        {variant.sku && <code className="font-mono text-[10px] text-muted-foreground/80">{variant.sku}</code>}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {unpriced ? (
            <span className="text-sm font-semibold text-muted-foreground">Coming soon</span>
          ) : (
            <span className="text-base font-bold tracking-tight">{formatPrice(variant.sellingPrice as number)}</span>
          )}
          {lowStock && <span className="text-[11px] font-semibold text-amber-600">Only {stock} left</span>}
        </div>

        {/* Two CTAs share the row: buying is primary, rating is the secondary action. */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            className="w-full"
            icon={ShoppingCart}
            iconPlacement="left"
            loading={addToCart.isPending}
            disabled={soldOut || unpriced || addToCart.isPending}
            onClick={handleAdd}
          >
            {soldOut ? 'Sold out' : 'Add'}
          </Button>
          <RateVariantButton
            variantId={variant.id}
            variantName={variant.name ?? description}
            sku={variant.sku}
            rating={variant.rating}
            ratingCount={variant.ratingCount}
            className="w-full"
          />
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
