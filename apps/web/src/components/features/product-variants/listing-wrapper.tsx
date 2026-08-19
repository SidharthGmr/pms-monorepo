'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import ProductVariantList from '.';

export default function ProductVariantListingWrapper() {
  return (
    <>
      {/* No "add" action: a variant is created against a product, on that product's own
          Variants screen, so there is nothing sensible to add from here. */}
      <PageHeader title="Variants" description="Every sellable SKU in the store, with its current price and on-hand stock" />
      <Card>
        <ProductVariantList />
      </Card>
    </>
  );
}
