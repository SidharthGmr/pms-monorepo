import PaymentListingWrapper from '@/components/features/payments/listing-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments',
  description: 'Cash and bank movement, receipts, supplier payments and outstanding balances.',
};

export default function PaymentsPage() {
  return (
    <div className="grid gap-5">
      <PaymentListingWrapper />
    </div>
  );
}
