import StaffListingWrapper from '@/components/features/staff/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Staff List - ${config.appName}`,
};

export default function StaffPage() {
  return (
    <div className="grid gap-5">
      <StaffListingWrapper />
    </div>
  );
}
