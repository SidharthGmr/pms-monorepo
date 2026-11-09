import DayBookListingWrapper from '@/components/features/day-book/listing-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Day Book',
  description: 'Every posted accounting voucher, by date.',
};

export default function DayBookPage() {
  return (
    <div className="grid gap-5">
      <DayBookListingWrapper />
    </div>
  );
}
