import VariantView, { VariantViewBackLink } from '@/components/features/product-variants/view-variant';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Variant - ${config.appName}`,
};

interface VariantViewPageProps {
  params: {
    id: string;
  };
}

export default function VariantViewPage({ params }: VariantViewPageProps) {
  const id = Number(params.id);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <VariantViewBackLink />
      <VariantView id={Number.isFinite(id) ? id : 0} />
    </div>
  );
}
