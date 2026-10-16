import CatalogList from '@/components/features/catalog';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Products - ${config.appName}`,
  description: 'Browse every product with variant-level filters: category, brand, colour, size, price, stock and rating.',
};

export default function PublicProductsPage() {
  return <CatalogList />;
}
