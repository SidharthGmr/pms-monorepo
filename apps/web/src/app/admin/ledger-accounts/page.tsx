import LedgerAccountListingWrapper from '@/components/features/ledger-accounts/listing-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chart of Accounts',
  description: 'The ledger accounts every journal line posts against.',
};

export default function LedgerAccountsPage() {
  return (
    <div className="grid gap-5">
      <LedgerAccountListingWrapper />
    </div>
  );
}
