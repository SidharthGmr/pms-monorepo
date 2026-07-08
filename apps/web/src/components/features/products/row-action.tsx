'use client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProductDto } from '@/dtos/product.dto';
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
  const item = row.original as ProductDto;
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);

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
          <DropdownMenuItem asChild className="cursor-pointer" >
            <Link href={`/admin/products/${item?.id}`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsAddStockOpen(true)}>
            Add Stock
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsStockHistoryOpen(true)}>
            Stock History
          </DropdownMenuItem>
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
        <StockHistoryModal
          productId={item.id}
          productName={item.name}
          isOpen={isStockHistoryOpen}
          onClose={() => setIsStockHistoryOpen(false)}
        />
      )}
    </>
  );
}
