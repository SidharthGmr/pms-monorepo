'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Tags } from 'lucide-react';
import { useCallback, useState } from 'react';
import PriceHistoryList from '.';

export default function PriceHistoryListingWrapper() {
  const [total, setTotal] = useState<number | undefined>(undefined);

  const handleCount = useCallback((value: number) => setTotal(value), []);

  return (
    <div className="space-y-4">
      <ListPageHeader
        icon={Tags}
        title="Price History"
        description={
          total === undefined
            ? 'Append-only ledger of what each variant sold for, and when'
            : `${total} ${total === 1 ? 'entry' : 'entries'} · append-only ledger of what each variant sold for, and when`
        }
      />
      <PriceHistoryList onCountChange={handleCount} />
    </div>
  );
}
