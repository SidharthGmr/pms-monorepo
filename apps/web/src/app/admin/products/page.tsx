 
import ProductListingWrapper from '@/components/features/products/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Product List- ${config.appName}`,
};

export default function ProductsPage() {
 
  return (
    <div className="grid gap-5"> 
      <ProductListingWrapper />
    </div>
  );
}
