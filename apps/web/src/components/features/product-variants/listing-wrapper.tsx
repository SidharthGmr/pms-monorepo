'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Layers, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import ProductVariantList from '.';
import ManageVariant from './add-edit';

export default function ProductVariantListingWrapper() {
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [showAdd, setShowAdd] = useState(false);
  const handleCount = useCallback((value: number) => setTotal(value), []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={Layers}
        title="Variants"
        description={
          total === undefined
            ? 'Every sellable SKU in the store, with its current price and on-hand stock'
            : `${total} ${total === 1 ? 'SKU' : 'SKUs'} · every sellable item with its current price and on-hand stock`
        }
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Add variant
          </Button>
        }
      />

      <ProductVariantList onCountChange={handleCount} />

      {showAdd && (
        <Dialog open onOpenChange={(open) => !open && setShowAdd(false)}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-4 text-left">
              <DialogTitle className="truncate text-base">Add variant</DialogTitle>
              <DialogDescription className="mt-1 text-xs">A sellable SKU with its own price and stock, under the product you pick.</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ManageVariant onCancel={() => setShowAdd(false)} onSaved={() => setShowAdd(false)} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
