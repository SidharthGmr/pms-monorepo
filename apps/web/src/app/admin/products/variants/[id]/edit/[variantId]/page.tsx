import { PageHeader } from '@/components/common/page-header';
import ManageVariant from '@/components/features/products/variants/add-edit';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Edit Variant - ${config.appName}`,
};

interface EditVariantPageProps {
  params: {
    id: number;
    variantId: number;
  };
}

export default function EditVariantPage({ params }: EditVariantPageProps) {
  const { id, variantId } = params;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Edit Variant" description="Update this variant's details, images, price and stock." variant="back" />

      <ManageVariant productId={Number(id)} variantId={Number(variantId)} />
    </div>
  );
}
