import PriceHistoryListingWrapper from '@/components/features/price-histories/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: `Price History - ${config.appName}`,
};

// The wrapper reads ?productId / ?variantId to pre-select the row an admin arrived from.
export default function PriceHistoriesPage() {
  return (
    <Suspense>
      <PriceHistoryListingWrapper />
    </Suspense>
  );
}
