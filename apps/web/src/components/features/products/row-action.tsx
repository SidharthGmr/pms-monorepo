'use client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProductResponseDto } from '@pms/types';
import { useQueryClient } from '@tanstack/react-query';
import { Boxes, Eye, History, MoreHorizontal, PackagePlus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import AddStockModal from './add-stock-modal';
import StockHistoryModal from './stock-history-modal';

interface ProductRowActionsProps {
  product: ProductResponseDto;
  onView: () => void;
  /** When given, Edit opens the form where the list is instead of navigating to the product. */
  onEdit?: () => void;
  onDelete: () => void;
}

// View and Edit sit inline; stock movements and the destructive delete live behind the "…" menu.
export default function ProductRowActions({ product, onView, onEdit, onDelete }: ProductRowActionsProps) {
  const queryClient = useQueryClient();
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onView} aria-label={`View ${product.name}`} title="View">
          <Eye className="h-4 w-4" />
        </Button>
        {onEdit ? (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onEdit} aria-label={`Edit ${product.name}`} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label={`Edit ${product.name}`} title="Edit">
            <Link href={`/admin/products/${product.id}?edit=1`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground data-[state=open]:bg-muted" aria-label={`More actions for ${product.name}`} title="More">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/admin/products/${product.id}/variants`}>
                <Boxes className="mr-2 h-4 w-4" />
                Variants
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsAddStockOpen(true)}>
              <PackagePlus className="mr-2 h-4 w-4" />
              Add stock
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsStockHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              Stock history
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isAddStockOpen && (
        <AddStockModal
          productId={product.id}
          productName={product.name}
          isOpen={isAddStockOpen}
          onClose={() => setIsAddStockOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['ProductService.getAll'] });
            queryClient.invalidateQueries({ queryKey: ['ProductService.getStockHistory', product.id] });
            setIsAddStockOpen(false);
          }}
        />
      )}

      {isStockHistoryOpen && (
        <StockHistoryModal productId={product.id} productName={product.name} isOpen={isStockHistoryOpen} onClose={() => setIsStockHistoryOpen(false)} />
      )}
    </>
  );
}
