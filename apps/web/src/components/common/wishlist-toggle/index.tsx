'use client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useAddToWishlist, useIsVariantInWishlist, useRemoveVariantFromWishlist } from '@/hooks/service-hooks/useWishlistService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

interface WishlistToggleProps {
  variantId: number;
  productName?: string | null;
  variant?: 'icon' | 'button';
  inWishlist?: boolean;
  className?: string;
}

export default function WishlistToggle({ variantId, productName, variant = 'icon', inWishlist: inWishlistProp, className }: WishlistToggleProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isControlled = inWishlistProp !== undefined;
  const { data: response, isLoading } = useIsVariantInWishlist(variantId, !isControlled);
  console.log(`${response}`, variantId);
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveVariantFromWishlist();

  const inWishlist = response?.data?.data?.inWishlist === true;
  const isPending = addMutation.isPending || removeMutation.isPending;
  const isBusy = (!isControlled && isLoading) || isPending;

  const toggle = async () => {
    try {
      const result = inWishlist ? await removeMutation.mutateAsync(variantId) : await addMutation.mutateAsync(variantId);

      if (result && (result.status === 200 || result.status === 201 || result.status === 204)) {
        toast({
          variant: 'success',
          title: inWishlist ? 'Removed from wishlist' : 'Saved to wishlist',
        });
        return;
      }
      const error = unitOfService.ErrorHandlerService.getErrorMessage<unknown>(result);
      toast({ variant: 'destructive', title: 'Wishlist update failed', description: <span>{error}</span> });
    } catch (error: any) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({ variant: 'destructive', title: 'Wishlist update failed', description: <span>{message || 'Unknown error occurred'}</span> });
    }
  };

  const label = inWishlist ? 'Remove from wishlist' : 'Save to wishlist';
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
