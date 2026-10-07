'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Layers, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import ProductVariantList from '.';

export default function ProductVariantListingWrapper() {
  const [total, setTotal] = useState<number | undefined>(undefined);
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
          <Button asChild className="h-9 gap-1.5">
            <Link href="/admin/product-variants/0">
              <Plus className="h-4 w-4" />
              Add variant
            </Link>
          </Button>
        }
      />

      <ProductVariantList onCountChange={handleCount} />
    </div>
  );
}
