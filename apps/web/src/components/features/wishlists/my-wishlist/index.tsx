'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';


import { useAddToCart, useCartMembership } from '@/hooks/service-hooks/useCartService';
import { useGetAllWishlists, useRemoveFromWishlist } from '@/hooks/service-hooks/useWishlistService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Check, ChevronLeft, ChevronRight, Eye, Heart, ImageIcon, Loader2, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { WishlistDto, StatusValues } from '@pms/types';

const GRID = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3';

/**
 * The signed-in user's saved products.
 *
 * `userId` is sent explicitly even though the API pins a plain customer to their own
 * list: this page is also reachable by STAFF, whom the API treats as staff and would
 * otherwise hand every user's wishlist. The query waits for the session so the first
 * request is never the unscoped one.
 */
export default function WishlistGrid() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { currentUser } = useGetCurrentUser();
  const [page, setPage] = useState(1);

  const userId = currentUser?.usersId;
  const {
    data: response,
    isLoading,
    isError,
  } = useGetAllWishlists({ userId, page, recordPerPage: config.recordPerPage }, !!userId);
  const removeMutation = useRemoveFromWishlist();
  const addToCartMutation = useAddToCart();
  const cart = useCartMembership(!!userId);
  const isInCart = (entry: WishlistDto) => (entry.variantId !== null ? cart.variantIds.has(entry.variantId) : cart.productIds.has(entry.productId));
  // Keyed on the wishlist row, not the product: two SKUs of one product are two rows,
  // and keying on productId would spin both buttons at once.
  const [addingEntryId, setAddingEntryId] = useState<number | null>(null);

  const { showModal: showRemoveModal, openModal: openRemoveModal, closeModal: closeRemoveModal, uniqueId: removeId } = useModalShowHide();

  const entries = useMemo<WishlistDto[]>(() => response?.data?.data?.data ?? [], [response]);
  const totalRecord = response?.data?.data?.totalRecord ?? 0;
  const hasMore = entries.length > 0 && page * config.recordPerPage < totalRecord;

  const handleRemove = async (id: number) => {
    const result = await removeMutation.mutateAsync(id);
    if (result && (result.status === 200 || result.status === 204)) {
      toast({ variant: 'success', title: 'Removed from wishlist' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeRemoveModal(true);
  };

  const handleAddToCart = async (entry: WishlistDto) => {
    setAddingEntryId(entry.id);
    try {
      // A variant save must add that exact SKU; only a product-level save may let the
      // API pick the product's effective variant.
      const result = await addToCartMutation.mutateAsync(
        entry.variantId !== null ? { variantIds: [entry.variantId] } : { productIds: [entry.productId] }
      );
      if (result && result.status === 201) {
        toast({ variant: 'success', title: 'Added to cart', description: entry.product?.name });
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
        toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{message}</span> });
    } finally {
      setAddingEntryId(null);
    }
  };

  return (
    <>
      <PageHeader title="My Wishlist" description={totalRecord > 0 ? `${totalRecord} ${totalRecord === 1 ? 'product' : 'products'} saved for later` : 'Products you saved for later'} variant="back" />

      {(isLoading || !userId) && (
        <div className={GRID} aria-busy="true" aria-label="Loading wishlist">
          {Array.from({ length: 6 }).map((_, key) => (
            <Card key={key} className="!p-0 overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card className="py-12 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load your wishlist</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      )}

      {!isLoading && !isError && !!userId && entries.length === 0 && (
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
            <Heart className="h-7 w-7 text-rose-500/70" />
          </span>
          <div className="space-y-1">
            <p className="font-semibold">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground">Tap the heart on any product and it will be waiting for you here.</p>
          </div>
          <Button asChild size="sm" className="mt-1 gap-1.5">
            <Link href="/dashboard">
              <ShoppingCart className="h-3.5 w-3.5" />
              Browse the shop
            </Link>
          </Button>
        </Card>
      )}

      <div className={GRID}>
        {entries.map((entry) => {
          const variant = entry.variant;
          // The saved SKU's own photo wins - it is the thing on the list.
          const image = variant?.images?.[0] ?? entry.product?.images?.[0];
          const variantLabel =
            variant &&
            (variant.name ||
              (variant.attributes && typeof variant.attributes === 'object'
                ? Object.entries(variant.attributes)
                    .map(([key, value]) => `${key}: ${String(value)}`)
                    .join(' · ')
                : '') ||
              variant.sku);
          // A product pulled from the catalogue after being saved should not look buyable.
          const isAvailable = !entry.product || entry.product.status === StatusValues.Published;
          const name = entry.product?.name || `Product #${entry.productId}`;
          const adding = addingEntryId === entry.id;

          return (
            <Card
              key={entry.id}
              className="!p-0 group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              {/* The photo is the card - everything else hangs off it. */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <Link href={`/dashboard/products/${entry.productId}`} aria-label={`View ${name}`} className="block h-full w-full">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={name}
                      className={cn('h-full w-full object-cover transition-transform duration-300 group-hover:scale-105', !isAvailable && 'opacity-50 grayscale')}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  aria-label={`Remove ${name} from wishlist`}
                  onClick={() => openRemoveModal(entry.id)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>

                {!isAvailable && (
                  <Badge variant="orange" className="absolute left-2 top-2 shadow-sm">
                    Unavailable
                  </Badge>
                )}
                {variantLabel && (
                  <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur">
                    {variantLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1 p-3">
                <Link href={`/dashboard/products/${entry.productId}`} className="outline-none focus-visible:underline">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug" title={name}>
                    {name}
                  </p>
                </Link>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {variant?.sku && (
                    <>
                      <code className="truncate font-mono">{variant.sku}</code>
                      <span aria-hidden>·</span>
                    </>
                  )}
                  <span className="shrink-0">
                    Saved {entry.addedAt ? unitOfService.DateTimeService.convertToLocalDate(entry.addedAt as unknown as Date, false) : '—'}
                  </span>
                </p>

                <div className="mt-auto flex items-center gap-1.5 pt-2.5">
                  {isInCart(entry) ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 flex-1 gap-1.5 border-emerald-600/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-400"
                    >
                      <Link href="/dashboard/cart">
                        <Check className="h-4 w-4" />
                        In cart
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="h-9 flex-1 gap-1.5" disabled={!isAvailable || adding} onClick={() => handleAddToCart(entry)}>
                      {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                      {adding ? 'Adding…' : 'Add to cart'}
                    </Button>
                  )}
                  <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label={`View ${name}`}>
                    <Link href={`/dashboard/products/${entry.productId}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="gap-1" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} · {totalRecord} saved
          </span>
          <Button variant="outline" size="sm" className="gap-1" disabled={!hasMore} onClick={() => setPage((prev) => prev + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showRemoveModal && removeId && (
        <ConfirmBox
          isOpen={showRemoveModal}
          onClose={() => closeRemoveModal(false)}
          onSubmit={() => handleRemove(+removeId)}
          heading="Remove from Wishlist"
          loading={removeMutation.isPending}
          bodyText="This product will no longer appear in your saved list."
        />
      )}
    </>
  );
}
