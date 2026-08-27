import PublicVariantList from '@/components/features/public-variants';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Products - ${config.appName}`,
  description: 'Browse every product variant currently available to buy.',
};

export default function PublicProductsPage() {
  return (
    <main className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">Every variant in stock or coming soon, with its current price.</p>
      </header>

      <PublicVariantList />
    </main>
  );
}
