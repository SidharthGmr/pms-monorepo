'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import PurchasesList from '.';

export default function ListingWrapper() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase History"
        description="View past stock additions and invoices"
        actionText='Receive Stock'
        href="/admin/receive-stock"
      />
      <Card>
        <PurchasesList />
      </Card>

    </div>
  );
}
