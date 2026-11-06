import EstimateListingWrapper from '@/components/features/estimates/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Estimates - ${config.appName}`,
};

export default function EstimatesPage() {
  return (
    <div className="grid gap-5">
      <EstimateListingWrapper />
    </div>
  );
}
