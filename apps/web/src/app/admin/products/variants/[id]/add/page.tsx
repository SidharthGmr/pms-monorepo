import { PageHeader } from '@/components/common/page-header';
import ManageVariant from '@/components/features/products/variants/add-edit';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Add Variant - ${config.appName}`,
};

interface AddVariantPageProps {
  params: {
    id: number;
  };
}

export default function AddVariantPage({ params }: AddVariantPageProps) {
  const { id } = params;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Add Variant" description="Create a new sellable variant of this product." variant="back" />

      <ManageVariant productId={Number(id)} />
    </div>
  );
}
