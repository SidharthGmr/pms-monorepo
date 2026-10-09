import VariantPage from '@/components/features/product-variants/variant-page';
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

// One variant by its own id. Route params arrive as strings, so the id has to be converted
// before it is handed over - a string never passes Number.isFinite, and the detail query is
// disabled for id 0, which leaves the page on its skeleton forever.
export default function VariantViewPage({ params }: VariantViewPageProps) {
  const id = Number(params.id);

  return <VariantPage id={Number.isFinite(id) ? id : 0} />;
}
