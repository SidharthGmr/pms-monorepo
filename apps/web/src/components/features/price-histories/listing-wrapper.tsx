'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import PriceHistoryList from '.';
import ManagePriceHistory from './add-edit';

export default function PriceHistoryListingWrapper() {
  const searchParams = useSearchParams();
  // Arriving from a product/variant screen pre-selects it in the add form.
  const productId = searchParams.get('productId') ? +searchParams.get('productId')! : undefined;
  const variantId = searchParams.get('variantId') ? +searchParams.get('variantId')! : undefined;
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Price History"
        description="Append-only price ledger — what each variant sold for, and when"
        variant="add"
        actionText="Record Price"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <PriceHistoryList />
      </Card>
      {showAddModal && (
        <ManagePriceHistory
          defaultProductId={productId}
          defaultVariantId={variantId}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
