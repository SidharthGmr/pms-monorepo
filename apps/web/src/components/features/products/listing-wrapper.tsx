'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import ProductList from '.';
import ManageProduct from './add-edit';

export default function ProductListingWrapper() {
  const [total, setTotal] = useState<number | undefined>(undefined);
  const handleCount = useCallback((value: number) => setTotal(value), []);

  // Add and edit both happen here rather than on their own route, so closing the form puts the
  // list back exactly as it was - same page, same filters. `0` is a new product.
  const [formId, setFormId] = useState<number | null>(null);
  const closeForm = useCallback(() => setFormId(null), []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {formId !== null ? (
        <ManageProduct id={formId} onCancel={closeForm} onSaved={closeForm} backLabel="Back to products" />
      ) : (
        <>
          <ListPageHeader
            icon={Package}
            title="Products"
            description={
              total === undefined
                ? 'Everything you sell, with its variants, images and stock'
                : `${total} ${total === 1 ? 'product' : 'products'} · everything you sell, with its variants, images and stock`
            }
            actions={
              <Button type="button" className="h-9 gap-1.5" onClick={() => setFormId(0)}>
                <Plus className="h-4 w-4" />
                Add product
              </Button>
            }
          />
          <ProductList onCountChange={handleCount} onEdit={setFormId} />
        </>
      )}
    </div>
  );
}
