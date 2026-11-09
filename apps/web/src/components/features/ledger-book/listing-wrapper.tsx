'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { BookText } from 'lucide-react';
import LedgerBook from './index';

export default function LedgerBookListingWrapper() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={BookText}
        title="Ledger Book"
        description="Opening balance, every movement and the closing balance for any account — all read from the journal."
      />
      <LedgerBook />
    </div>
  );
}
