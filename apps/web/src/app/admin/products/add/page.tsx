import ManageProduct from '@/components/features/products/add-edit';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Add product - ${config.appName}`,
};

export default function AddProductPage() {
  return (
    <>
      <ManageProduct id={0} backLabel="Back to products" />
    </>
  );
}
