
import { PageHeader } from '@/components/common/page-header';
import ManageProduct from '@/components/features/products/add-edit';
import { Card } from '@/components/ui/card';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Add Product - ${config.appName}`,
};

interface ProductsPageProps {
  params: {
    id: number;
  };
}


export default function ProductsPage({ params }: ProductsPageProps) {
  const { id } = params;


  return (
    <div className=" mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`${id > 0 ? 'Edit' : 'Add'} Product`}
        description={`${id > 0 ? 'Update' : 'Create'} product details and manage inventory`}
        variant="back"
      />
      <Card>
        <ManageProduct id={id} />
      </Card>
    </div>
  );
}
