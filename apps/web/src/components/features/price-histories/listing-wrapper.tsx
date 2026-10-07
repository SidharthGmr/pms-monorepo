'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Plus, Tags } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import PriceHistoryList from '.';
import ManagePriceHistory from './add-edit';

export default function PriceHistoryListingWrapper() {
  const searchParams = useSearchParams();
  // Arriving from a product/variant screen pre-selects it in the add form.
  const productId = searchParams.get('productId') ? +searchParams.get('productId')! : undefined;
  const variantId = searchParams.get('variantId') ? +searchParams.get('variantId')! : undefined;
  const [showAddModal, setShowAddModal] = useState(false);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const handleCount = useCallback((value: number) => setTotal(value), []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={Tags}
        title="Price History"
        description={
          total === undefined
            ? 'Append-only ledger of what each variant sold for, and when'
            : `${total} ${total === 1 ? 'entry' : 'entries'} · append-only ledger of what each variant sold for, and when`
        }
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Record price
          </Button>
        }
      />
      <PriceHistoryList onCountChange={handleCount} />

      {showAddModal && <ManagePriceHistory defaultProductId={productId} defaultVariantId={variantId} isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
