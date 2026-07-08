import StaffSalaryListingWrapper from '@/components/features/staff-salaries/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Staff Salary List - ${config.appName}`,
};

export default function StaffSalariesPage() {
  return (
    <div className="grid gap-5">
      <StaffSalaryListingWrapper />
    </div>
  );
}
