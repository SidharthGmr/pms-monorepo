import PriceHistoryListingWrapper from '@/components/features/price-histories/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Price History - ${config.appName}`,
};

export default function PriceHistoriesPage() {
  return (
    <div className="grid gap-5">
      <PriceHistoryListingWrapper />
    </div>
  );
}
