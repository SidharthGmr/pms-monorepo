'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import EstimateList from '.';

export default function EstimateListingWrapper() {
  const [total, setTotal] = useState<number | undefined>(undefined);
  const handleCount = useCallback((value: number) => setTotal(value), []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={FileText}
        title="Estimates"
        description={
          total === undefined
            ? 'Quotations offered to customers — no stock or payment moves until one becomes an order'
            : `${total} ${total === 1 ? 'estimate' : 'estimates'} · quotations offered to customers`
        }
        actions={
          <Button asChild className="h-9 gap-1.5">
            <Link href="/admin/estimates/new">
              <Plus className="h-4 w-4" />
              New Estimate
            </Link>
          </Button>
        }
      />

      <EstimateList onCountChange={handleCount} />
    </div>
  );
}
