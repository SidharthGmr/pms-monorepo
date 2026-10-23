'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Undo2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import OrderReturnList from '.';

export default function OrderReturnListingWrapper() {
  const [total, setTotal] = useState<number | undefined>(undefined);
  const handleCount = useCallback((value: number) => setTotal(value), []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={Undo2}
        title="Returns"
        description={
          total === undefined
            ? 'Refunds and exchanges raised against delivered invoices'
            : `${total} ${total === 1 ? 'return' : 'returns'} · refunds and exchanges raised against delivered invoices`
        }
      />

      <OrderReturnList onCountChange={handleCount} />
    </div>
  );
}
