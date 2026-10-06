import VariantDetail from '@/components/features/public-variants/variant-detail';
import config from '@/config';
import { Metadata } from 'next';

interface PublicVariantPageProps {
  params: {
    sku: string;
  };
}

export function generateMetadata({ params }: PublicVariantPageProps): Metadata {
  const sku = decodeURIComponent(params.sku);
  return {
    title: `${sku} - ${config.appName}`,
    description: `Price, stock, options and details for ${sku}.`,
  };
}

export default function PublicVariantPage({ params }: PublicVariantPageProps) {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <VariantDetail sku={decodeURIComponent(params.sku)} />
    </main>
  );
}
