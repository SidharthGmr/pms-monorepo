import PriceHistoryListingWrapper from '@/components/features/price-histories/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Price History - ${config.appName}`,
};

// Lives under /product-variants so the sidebar keeps the Variants section active while
// reading a variant's ledger. Filtering arrives as ?variantId= / ?productId=.
export default function VariantPriceHistoriesPage() {
  return <PriceHistoryListingWrapper />;
}
