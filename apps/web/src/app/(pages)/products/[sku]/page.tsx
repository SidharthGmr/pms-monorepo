import CatalogProductDetail from '@/components/features/catalog/product-detail';
import config from '@/config';
import { Metadata } from 'next';

interface PublicProductPageProps {
  // Historically a variant SKU; now usually the product slug. The API resolves either.
  params: { sku: string };
}

export function generateMetadata({ params }: PublicProductPageProps): Metadata {
  const name = decodeURIComponent(params.sku).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: `${name} - ${config.appName}` };
}

export default function PublicProductPage({ params }: PublicProductPageProps) {
  return <CatalogProductDetail slug={decodeURIComponent(params.sku)} />;
}
