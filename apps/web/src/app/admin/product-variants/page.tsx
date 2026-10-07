import ProductVariantListingWrapper from '@/components/features/product-variants/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Variants - ${config.appName}`,
};

export default function ProductVariantsPage() {
  return <ProductVariantListingWrapper />;
}
