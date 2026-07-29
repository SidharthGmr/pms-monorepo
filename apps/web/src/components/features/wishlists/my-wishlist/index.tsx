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
import { WishlistDto } from '@/dtos/wishlist.dto';
import { StatusValues } from '@/enums/status-values.enum';
import { useAddToCart } from '@/hooks/service-hooks/useCartService';
import { useGetAllWishlists, useRemoveFromWishlist } from '@/hooks/service-hooks/useWishlistService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Heart, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

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
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

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
    setAddingProductId(entry.productId);
    try {
      const result = await addToCartMutation.mutateAsync({ productIds: [entry.productId] });
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
      setAddingProductId(null);
    }
  };

  return (
    <>
      <PageHeader title="My Wishlist" description="Products you saved for later" variant="back" />

      {(isLoading || !userId) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && <div className="py-10 text-center text-destructive">Error loading your wishlist</div>}

      {!isLoading && !isError && !!userId && entries.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <Heart className="h-8 w-8 text-muted-foreground/40" />
          <span className="font-medium">Your wishlist is empty</span>
          <span className="text-sm text-muted-foreground">Save a product from the product list to find it here later.</span>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => {
          const image = entry.product?.images?.[0];
          // A product pulled from the catalogue after being saved should not look buyable.
          const isAvailable = !entry.product || entry.product.status === StatusValues.Published;

          return (
            <Card key={entry.id} className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={entry.product?.name ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="block truncate font-medium" title={entry.product?.name}>
                    {entry.product?.name || `Product #${entry.productId}`}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Saved{' '}
                    {entry.addedAt ? unitOfService.DateTimeService.convertToLocalDate(entry.addedAt as unknown as Date, false) : '—'}
                  </span>
                  {!isAvailable && <Badge variant="orange">Unavailable</Badge>}
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!isAvailable || addingProductId === entry.productId}
                  onClick={() => handleAddToCart(entry)}
                >
                  {addingProductId === entry.productId ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/products/${entry.productId}`}>View</Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openRemoveModal(entry.id)}>
                  Remove
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} · {totalRecord} saved
          </span>
          <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage((prev) => prev + 1)}>
            Next
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
