'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import WishlistList from '.';

export default function WishlistListingWrapper() {
  return (
    <>
      {/* No action button: entries are created by customers saving products. */}
      <PageHeader title="Customer Wishlists" description="What customers saved but have not bought yet" />
      <Card>
        <WishlistList />
      </Card>
    </>
  );
}
