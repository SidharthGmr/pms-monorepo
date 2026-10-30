'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProductResponseDto, StatusValues } from '@pms/types';
import { useQueryClient } from '@tanstack/react-query';
import { Boxes, History, MoreHorizontal, PackagePlus } from 'lucide-react';
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

// View, Edit and Delete sit inline as the shared ActionTooltip pills; stock movements and the
// variants link live behind the "…" menu. Trashed rows lose the delete action.
export default function ProductRowActions({ product, onView, onEdit, onDelete }: ProductRowActionsProps) {
  const queryClient = useQueryClient();
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <ActionTooltip variant="view" tooltip="View" ariaLabel={`View ${product.name}`} onClick={onView} />
        {onEdit ? (
          <ActionTooltip variant="edit" tooltip="Edit" ariaLabel={`Edit ${product.name}`} onClick={onEdit} />
        ) : (
          <ActionTooltip variant="edit" tooltip="Edit" ariaLabel={`Edit ${product.name}`} href={`/admin/products/${product.id}?edit=1`} />
        )}
        {product.status !== StatusValues.Trash && <ActionTooltip variant="delete" tooltip="Delete" ariaLabel={`Delete ${product.name}`} onClick={onDelete} />}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground data-[state=open]:bg-muted"
              aria-label={`More actions for ${product.name}`}
              title="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/admin/products/${product.id}`}>
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
