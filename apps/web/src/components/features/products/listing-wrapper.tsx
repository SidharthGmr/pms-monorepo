'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import ProductList from '.';
import Link from 'next/link';

export default function ProductListingWrapper() {
  const [total, setTotal] = useState<number | undefined>(undefined);
  const handleCount = useCallback((value: number) => setTotal(value), []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <ListPageHeader
        icon={Package}
        title="Products"
        description={
          total === undefined
            ? 'Everything you sell, with its variants, images and stock'
            : `${total} ${total === 1 ? 'product' : 'products'} · everything you sell, with its variants, images and stock`
        }
        actions={
          <Button icon={Plus} type="button" variant={'light'}>
            <Link href={`/admin/products/${0}`}>Add product</Link>
          </Button>
        }
      />

      <>
        <ProductList onCountChange={handleCount} />
      </>
    </div>
  );
}
