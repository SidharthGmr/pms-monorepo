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
    <div className="mx-auto  space-y-6">
      <PageHeader
        title="Product Variants"
        description="Sellable combinations of this product. Each variant's price is kept in the price history ledger."
        variant="back"
      />

      <ProductVariants productId={Number(id)} />
    </div>
  );
}
