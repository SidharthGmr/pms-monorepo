import { PageHeader } from '@/components/common/page-header';
import ManageProduct from '@/components/features/products/add-edit';
import { Card } from '@/components/ui/card';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Add Product - ${config.appName}`,
};

export default function ProductsPage() {
  return (
    <div className=" mx-auto max-w-6xl space-y-6">
      <PageHeader title={`Add Product`} description={`Create product details and manage inventory`} variant="back" />

      <ManageProduct id={0} />
    </div>
  );
}
