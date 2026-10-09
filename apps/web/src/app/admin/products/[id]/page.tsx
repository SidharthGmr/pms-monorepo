import ProductPage from '@/components/features/products/product-page';
import config from '@/config';
import { Metadata } from 'next';

interface ProductsPageProps {
  params: {
    id: string;
  };
}

export function generateMetadata({ params }: ProductsPageProps): Metadata {
  const id = Number(params.id);
  return {
    title: `${id > 0 ? 'Product' : 'Add Product'} - ${config.appName}`,
  };
}

export default function ProductsPage({ params }: ProductsPageProps) {
  // The route is shared: /admin/products/0 renders the create form, /admin/products/12 opens
  // product 12 - its details, or the form when ?edit=1.
  const id = Number(params.id);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <ProductPage id={Number.isFinite(id) ? id : 0} />
    </div>
  );
}
