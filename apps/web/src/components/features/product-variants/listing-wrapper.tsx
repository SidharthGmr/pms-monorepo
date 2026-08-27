'use client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import ProductVariantList from '.';

export default function ProductVariantListingWrapper() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Variants" description="Every sellable SKU in the store, with its current price and on-hand stock" />
        <Button asChild icon={Plus} iconPlacement="left" className="shrink-0">
          <Link href="/admin/product-variants/0">Add Variant</Link>
        </Button>
      </div>
      <Card>
        <ProductVariantList />
      </Card>
    </>
  );
}
