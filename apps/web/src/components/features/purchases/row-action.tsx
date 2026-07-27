'use client';
import { Button } from '@/components/ui/button';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { Row } from '@tanstack/react-table';
import { ExternalLink, Eye } from 'lucide-react';
import { useState } from 'react';
import PurchaseItemsModal from './purchase-items-modal';

interface PurchaseListRowActionsProps<TData> {
  row: Row<TData>;
}

export default function PurchaseListRowActions<TData>({ row }: PurchaseListRowActionsProps<TData>) {
  const purchase = row.original as PurchaseDto;
  const [isItemsOpen, setIsItemsOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2 justify-end px-4">
        <Button variant="outline" size="sm" onClick={() => setIsItemsOpen(true)}>
          <Eye className="w-4 h-4 mr-2" />
          View Items
        </Button>
        {purchase.invoiceUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={purchase.invoiceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Invoice
            </a>
          </Button>
        )}
      </div>

      {isItemsOpen && <PurchaseItemsModal purchase={purchase} isOpen={isItemsOpen} onClose={() => setIsItemsOpen(false)} />}
    </>
  );
}
