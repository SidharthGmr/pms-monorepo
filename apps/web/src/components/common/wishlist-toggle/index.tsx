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
  /**
   * Pins the save to one SKU of the product. Omit it on a product grid or product page,
   * where there is no single variant to pin - that saves the product itself, and is what
   * every caller did before variants were savable.
   */
  variantId?: number;
  /** Names the product in the assistive label, so a grid of identical hearts is distinguishable. */
  productName?: string | null;
  variant?: 'icon' | 'button';
  inWishlist?: boolean;
  className?: string;
}

export default function WishlistToggle({
  productId,
  variantId,
  productName,
  variant = 'icon',
  inWishlist: inWishlistProp,
  className,
}: WishlistToggleProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isControlled = inWishlistProp !== undefined;
  const { data: response, isLoading } = useIsInWishlist(productId, !isControlled, variantId);

  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveProductFromWishlist();

  const inWishlist = isControlled ? inWishlistProp : response?.data?.data?.inWishlist === true;
  const isPending = addMutation.isPending || removeMutation.isPending;
  const isBusy = (!isControlled && isLoading) || isPending;

  const toggle = async () => {
    // The same (productId, variantId) pair on both sides, so the toggle removes exactly
    // what it saved rather than some other SKU of the product.
    const target = { productId, ...(variantId !== undefined && { variantId }) };
    const result = inWishlist ? await removeMutation.mutateAsync(target) : await addMutation.mutateAsync(target);

    if (result && (result.status === 200 || result.status === 201 || result.status === 204)) {
      toast({
        variant: 'success',
        title: inWishlist ? 'Removed from wishlist' : 'Saved to wishlist',
      });
      return;
    }

    const error = unitOfService.ErrorHandlerService.getErrorMessage<unknown>(result);
    toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
  };

  const label = inWishlist ? 'Remove from wishlist' : 'Save to wishlist';
  // The visible button text stays short; only the assistive label names the product.
  const accessibleLabel = productName ? `${label}: ${productName}` : label;
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
      title={accessibleLabel}
      aria-label={accessibleLabel}
      aria-pressed={inWishlist}
      disabled={isBusy}
      onClick={toggle}
      className={cn('h-8 w-8', className)}
    >
      <Icon className={cn('h-4 w-4', inWishlist ? 'text-rose-500' : 'text-muted-foreground')} />
    </Button>
  );
}
