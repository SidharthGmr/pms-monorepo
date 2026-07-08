'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import ProductList from '.';

export default function ProductListingWrapper() {

  return (
    <>
      <PageHeader
        title={`Products`}
        description="Manage product listings"
        variant="add"
        actionText="Add Product"
        href={`/admin/products/0`}
      />
      <Card>
        <ProductList />
      </Card>
    </>
  );
}
