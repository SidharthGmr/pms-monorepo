import ShopPage from '@/components/features/shop';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Shop - ${config.appName}`,
};

export default function Shop() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Shop</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Browse the catalog, filter by product or category, and add to your cart.</p>
      </div>
      <ShopPage />
    </div>
  );
}
