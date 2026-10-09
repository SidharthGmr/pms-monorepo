import ProductVariants from '@/components/features/products/variants';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Product Variants - ${config.appName}`,
};

interface ProductVariantsPageProps {
  params: {
    id: string;
  };
}

// Every variant of one product. The id here is the product's; a single variant lives at
// /admin/products/variants/<variantId>.
export default function ProductVariantsPage({ params }: ProductVariantsPageProps) {
  const id = Number(params.id);

  return <ProductVariants productId={Number.isFinite(id) ? id : 0} />;
}
