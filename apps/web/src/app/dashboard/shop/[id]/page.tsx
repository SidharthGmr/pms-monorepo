import ProductDetail from '@/components/features/shop/product-detail';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Product - ${config.appName}`,
};

interface ShopProductPageProps {
  params: {
    id: string;
  };
}

export default function ShopProductPage({ params }: ShopProductPageProps) {
  const productId = parseInt(params.id, 10);

  return (
    <div className="mx-auto max-w-6xl">
      <ProductDetail productId={Number.isNaN(productId) ? 0 : productId} />
    </div>
  );
}
