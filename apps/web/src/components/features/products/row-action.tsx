'use client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ProductDto } from '@/dtos/product.dto';
import { useAddToCart } from '@/hooks/service-hooks/useCartService';
import { useAddToWishlist, useIsInWishlist, useRemoveProductFromWishlist } from '@/hooks/service-hooks/useWishlistService';
import { ProductPricing } from '@/hooks/useProductPricing';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import Link from 'next/link';
import { useState } from 'react';
import AddStockModal from './add-stock-modal';
import StockHistoryModal from './stock-history-modal';

interface ProductListRowActionsProps<TData> {
  row: Row<TData>;
  deleteRecord: (id: number) => void;
  pricing?: ProductPricing;
}

export default function ProductListRowActions<TData>({ row, deleteRecord, pricing }: ProductListRowActionsProps<TData>) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const item = row.original as ProductDto;
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);
  const addToCartMutation = useAddToCart();

  const { data: wishlistResponse } = useIsInWishlist(item.id);
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveProductFromWishlist();
  const inWishlist = wishlistResponse?.data?.data?.inWishlist === true;
  const isWishlistPending = addToWishlistMutation.isPending || removeFromWishlistMutation.isPending;

  // The cart snapshots a price from the product's effective variant, so a
  // product with no price cannot be added at all.
  const isPriced = pricing?.sellingPrice != null;

  const handleWishlistToggle = async () => {
    try {
      // Product-level save: this row is a product, not a SKU, so no variantId is pinned.
      const response = inWishlist
        ? await removeFromWishlistMutation.mutateAsync({ productId: item.id })
        : await addToWishlistMutation.mutateAsync({ productId: item.id });

      if (response && (response.status === 200 || response.status === 201 || response.status === 204)) {
        toast({
          variant: 'success',
          title: inWishlist ? 'Removed from wishlist' : 'Saved to wishlist',
          description: item.name,
        });
      } else {
        // Explicit type argument: add returns the row, remove returns void, and the
        // union of the two leaves the generic uninferrable.
        const error = unitOfService.ErrorHandlerService.getErrorMessage<unknown>(response);
        toast({ variant: 'destructive', title: 'Wishlist update failed', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({ variant: 'destructive', title: 'Wishlist update failed', description: <span>{message || 'Unknown error occurred'}</span> });
    }
  };

  const handleAddToCart = async () => {
    try {
      const response = await addToCartMutation.mutateAsync({ productIds: [item.id] });
      if (response && response.status === 201) {
        toast({ variant: 'success', title: 'Added to cart', description: `${item.name} was added to your cart.` });
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({ variant: 'destructive', title: 'Could not add to cart', description: <span>{message || 'Unknown error occurred'}</span> });
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-3 w-8 p-0 data-[state=open]:bg-muted">
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[160px]">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/admin/products/${item?.id}`}>Edit</Link>
          </DropdownMenuItem>
          {isPriced && (
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsAddStockOpen(true)}>
              Add Stock
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/admin/products/variants/${item?.id}`}>Variants</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => deleteRecord(item.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* {isAddStockOpen && (
        <AddStockModal
          productId={item.id}
          productName={item.name}
          isOpen={isAddStockOpen}
          onClose={() => setIsAddStockOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {isStockHistoryOpen && (
        <StockHistoryModal productId={item.id} productName={item.name} isOpen={isStockHistoryOpen} onClose={() => setIsStockHistoryOpen(false)} />
      )} */}
    </>
  );
}
