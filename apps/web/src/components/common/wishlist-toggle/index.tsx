'use client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useAddToWishlist, useIsInWishlist, useRemoveProductFromWishlist } from '@/hooks/service-hooks/useWishlistService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

interface WishlistToggleProps {
  productId: number;
  productName?: string;
  /** `icon` for a bare heart, `button` for a labelled button. */
  variant?: 'icon' | 'button';
  /**
   * Pre-resolved membership. Pass it when the parent already knows the answer - a grid
   * that fetched the whole wishlist once - so a page of cards costs one request instead
   * of one per card. Omit it and the toggle resolves its own state.
   */
  inWishlist?: boolean;
  className?: string;
}

/**
 * Saves/unsaves a product for the signed-in user. When it owns the membership check,
 * that check is its own query so the heart is correct on first paint instead of
 * flickering.
 */
export default function WishlistToggle({ productId, productName, variant = 'icon', inWishlist: inWishlistProp, className }: WishlistToggleProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isControlled = inWishlistProp !== undefined;
  const { data: response, isLoading } = useIsInWishlist(productId, !isControlled);
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveProductFromWishlist();

  const inWishlist = isControlled ? inWishlistProp : response?.data?.data?.inWishlist === true;
  const isPending = addMutation.isPending || removeMutation.isPending;
  const isBusy = (!isControlled && isLoading) || isPending;

  const toggle = async () => {
    const result = inWishlist ? await removeMutation.mutateAsync(productId) : await addMutation.mutateAsync(productId);

    if (result && (result.status === 200 || result.status === 201 || result.status === 204)) {
      toast({
        variant: 'success',
        title: inWishlist ? 'Removed from wishlist' : 'Saved to wishlist',
        ...(productName && { description: productName }),
      });
      return;
    }

    // Explicit type argument: add returns the row, remove returns void, and the union
    // of the two leaves the generic uninferrable.
    const error = unitOfService.ErrorHandlerService.getErrorMessage<unknown>(result);
    toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
  };

  const label = inWishlist ? 'Remove from wishlist' : 'Save to wishlist';
  const Icon = inWishlist ? FaHeart : FaRegHeart;

  if (variant === 'button') {
    return (
      <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={toggle} className={className}>
        <Icon className={cn('mr-2 h-4 w-4', inWishlist && 'text-rose-500')} />
        {isPending ? 'Saving...' : label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      aria-pressed={inWishlist}
      disabled={isBusy}
      onClick={toggle}
      className={cn('h-8 w-8', className)}
    >
      <Icon className={cn('h-4 w-4', inWishlist ? 'text-rose-500' : 'text-muted-foreground')} />
    </Button>
  );
}
