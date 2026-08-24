'use client';

import ProductRating from '@/components/features/pos/product-rating';
import WishlistToggle from '@/components/common/wishlist-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { useAddToCart, useGetActiveCart } from '@/hooks/service-hooks/useCartService';
import { useGetAllWishlists } from '@/hooks/service-hooks/useWishlistService';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Package, Search, ShoppingBag, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

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

const imageFor = (variant: ProductVariantListItemDto): string | undefined => variant.images?.[0] ?? variant.product?.images?.[0];

/**
 * What a signed-in customer sees: the store's sellable SKUs with an Add to cart on each.
 * Adds are variant-keyed, so picking the 128GB does not quietly put the 64GB in the basket.
 */
export default function ShopPage() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { currentUser } = useGetCurrentUser();

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch] = useDebounce(searchText, 500);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const storeCode = (currentUser as { storeCode?: string | null } | undefined)?.storeCode ?? undefined;

  const { data: response, isLoading, isError } = useGetAllPublicProductVariants(
    {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(storeCode ? { storeCode } : {}),
      page,
      recordPerPage: config.recordPerPage,
    },
    !!currentUser
  );

  const { data: cartResponse } = useGetActiveCart();
  const addToCart = useAddToCart();

  // One request resolves every heart on the page; each toggle receives its membership
  // instead of asking `/wishlists/has/:productId` per card.
  const { data: wishlistResponse } = useGetAllWishlists({ showAllRecords: true }, !!currentUser);
  const wishedProductIds = useMemo(
    () => new Set((wishlistResponse?.data?.data?.data ?? []).map((item) => item.productId)),
    [wishlistResponse]
  );

  const variants = useMemo(() => response?.data?.data?.data ?? [], [response]);
  const recordCount = response?.data?.data?.totalRecord ?? 0;

  const cartItems = cartResponse?.data?.data?.items ?? [];
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const inCart = (variantId: number) => cartItems.find((item) => item.variantId === variantId)?.quantity ?? 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const categories = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.product?.category?.name).filter((name): name is string => !!name))).sort(),
    [variants]
  );

  const visible = category ? variants.filter((variant) => variant.product?.category?.name === category) : variants;
  const pageCount = Math.max(1, Math.ceil((recordCount || 0) / config.recordPerPage));

  const handleAdd = async (variant: ProductVariantListItemDto) => {
    setPendingId(variant.id);
    try {
      const result = await addToCart.mutateAsync({ variantIds: [variant.id] });
      if (result && (result.status === 200 || result.status === 201)) {
        toast({ variant: 'success', title: 'Added to cart', description: `${variant.product?.name ?? variant.sku} is in your cart.` });
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
        toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{error}</span> });
      }
    } catch (error) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error as never);
      toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{message || 'Unknown error occurred'}</span> });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop</h1>
          <p className="text-sm text-muted-foreground">Browse what is in stock and add it to your cart.</p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="h-11 rounded-xl bg-background pl-10"
            />
          </div>
          <Link href="/dashboard/cart" className="shrink-0">
            <Button variant="outline" className="relative h-11 rounded-xl">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{cartCount}</span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              category === undefined ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'
            }`}
          >
            All
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                category === name ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden rounded-xl p-0">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Couldn&apos;t load the catalogue</p>
          <p className="mt-1 text-xs text-muted-foreground">Please try again in a moment.</p>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="py-16 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold">Nothing to show yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {debouncedSearch ? 'Try a different search term.' : 'This store has no products on sale at the moment.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((variant) => {
            const stock = variant.stockQuantity ?? 0;
            const soldOut = stock <= 0;
            const unpriced = variant.sellingPrice === null || variant.sellingPrice === undefined;
            const description = describeVariant(variant);
            const image = imageFor(variant);
            const already = inCart(variant.id);
            const productUrl = `/dashboard/shop/${variant.productId}`;

            return (
              <Card key={variant.id} className="group flex flex-col overflow-hidden rounded-xl p-0 shadow-sm transition-shadow hover:shadow-md">
                <div className="relative aspect-square overflow-hidden bg-muted/30">
                  <Link href={productUrl} className="block h-full w-full">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={`${variant.product?.name ?? 'Product'}${description ? ` - ${description}` : ''}`}
                        className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-9 w-9 text-muted-foreground/30" />
                      </div>
                    )}
                  </Link>
                  {/* Badges stack down the left so Sold out and in-cart never overlap. */}
                  <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
                    {soldOut && (
                      <span className="rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-bold uppercase text-background">Sold out</span>
                    )}
                    {already > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{already} in cart</span>
                    )}
                  </div>
                  <WishlistToggle
                    productId={variant.productId}
                    productName={variant.product?.name}
                    inWishlist={wishedProductIds.has(variant.productId)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 shadow-sm backdrop-blur hover:bg-background"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-0.5 p-3">
                  {variant.product?.category?.name && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{variant.product.category.name}</span>
                  )}
                  <Link href={productUrl} className="hover:underline">
                    <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">{variant.product?.name ?? variant.sku}</h3>
                  </Link>
                  <p className="line-clamp-1 min-h-[1rem] text-[11px] text-muted-foreground">{description}</p>
                  <div className="mt-1">
                    <ProductRating productId={variant.productId} />
                  </div>

                  <div className="mt-2">
                    {unpriced ? (
                      <span className="text-sm font-semibold text-muted-foreground">Coming soon</span>
                    ) : (
                      <span className="text-base font-bold tracking-tight">{formatPrice(variant.sellingPrice as number)}</span>
                    )}
                    {!soldOut && !unpriced && stock <= (variant.lowStockThreshold || 5) && (
                      <span className="ml-2 text-[11px] font-semibold text-amber-600">Only {stock} left</span>
                    )}
                  </div>

                  <div className="mt-3">
                    <Button
                      size="sm"
                      className="h-9 w-full rounded-lg text-xs font-semibold"
                      disabled={soldOut || unpriced || pendingId === variant.id}
                      onClick={() => handleAdd(variant)}
                    >
                      {pendingId === variant.id ? (
                        'Adding...'
                      ) : soldOut ? (
                        'Sold out'
                      ) : unpriced ? (
                        'Not yet on sale'
                      ) : (
                        <>
                          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                          Add to cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && pageCount > 1 && !category && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount} · {recordCount} items
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <Button variant="outline" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {cartCount > 0 && (
        <div className="sticky bottom-4 flex justify-center">
          <Link href="/dashboard/checkout">
            <Button size="lg" className="rounded-full shadow-lg">
              Checkout {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
