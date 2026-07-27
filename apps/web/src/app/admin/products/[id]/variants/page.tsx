import { PageHeader } from '@/components/common/page-header';
import ProductVariants from '@/components/features/products/variants';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Product Variants - ${config.appName}`,
};

interface ProductVariantsPageProps {
  params: {
    id: number;
  };
}

export default function ProductVariantsPage({ params }: ProductVariantsPageProps) {
  const { id } = params;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Product Variants"
        description="Append-only price history. Adding a variant supersedes the current active price."
        variant="back"
      />

      <ProductVariants productId={Number(id)} />
    </div>
  );
}
