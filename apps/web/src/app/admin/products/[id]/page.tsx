import ManageProduct from '@/components/features/products/add-edit';
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
    title: `${id > 0 ? 'Edit' : 'Add'} Product - ${config.appName}`,
  };
}

export default function ProductsPage({ params }: ProductsPageProps) {
  // The route is shared: /admin/products/add renders the create form, /admin/products/12 edits product 12.
  const id = Number(params.id);

  return (
    <div className="mx-auto max-w-6xl">
      <ManageProduct id={Number.isFinite(id) ? id : 0} />
    </div>
  );
}
