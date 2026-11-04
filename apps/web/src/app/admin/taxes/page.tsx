import TaxListingWrapper from '@/components/features/taxes/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Taxes - ${config.appName}`,
};

export default function TaxesPage() {
  return <TaxListingWrapper />;
}
