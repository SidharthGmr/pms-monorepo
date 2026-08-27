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
    <div className="space-y-6">
      <PageHeader title="Edit Variant" description="Update this variant's details, images, price and stock." variant="back" />
      <ProductVariants productId={id} />
    </div>
  );
}
