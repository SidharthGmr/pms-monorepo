import LedgerBookListingWrapper from '@/components/features/ledger-book/listing-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ledger Book',
  description: 'Account-wise and party-wise ledger statements with running balances.',
};

export default function LedgerBookPage() {
  return (
    <div className="grid gap-5">
      <LedgerBookListingWrapper />
    </div>
  );
}
