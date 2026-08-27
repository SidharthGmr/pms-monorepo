import { PageHeader } from '@/components/common/page-header';
import ManageVariant from '@/components/features/product-variants/add-edit';
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
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Edit Variant" description="Update this variant's details, images, price and stock." variant="back" />
      <ManageVariant id={id} />
    </div>
  );
}
