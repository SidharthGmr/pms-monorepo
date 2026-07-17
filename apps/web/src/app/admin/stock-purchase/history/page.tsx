import { Metadata } from 'next';
import config from '@/config';
import ListingWrapper from '@/components/features/purchases/listing-wrapper';

export const metadata: Metadata = {
  title: `Purchases - ${config.appName}`,
};

export default function PurchasesPage() {
  return <ListingWrapper />;
}
