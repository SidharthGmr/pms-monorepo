'use client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ProductDto } from '@/dtos/product.dto';
import { useAddToCart } from '@/hooks/service-hooks/useCartService';
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
}

export default function ProductListRowActions<TData>({ row, deleteRecord }: ProductListRowActionsProps<TData>) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const item = row.original as ProductDto;
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);
  const addToCartMutation = useAddToCart();

  // The cart snapshots a price from the product's effective variant, so a
  // product with no price cannot be added at all.
  const isPriced = item.currentPrice?.sellingPrice != null;

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
          {item.currentPrice?.costPrice && (
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsAddStockOpen(true)}>
              Add Stock
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsStockHistoryOpen(true)}>
            Stock History
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/admin/products/${item?.id}/variants`}>Variants</Link>
          </DropdownMenuItem>
          {isPriced && (
            <DropdownMenuItem className="cursor-pointer" disabled={addToCartMutation.isPending} onClick={handleAddToCart}>
              {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => deleteRecord(item.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isAddStockOpen && (
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
      )}

    </>
  );
}
