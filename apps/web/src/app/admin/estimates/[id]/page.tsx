import EstimateDetailsView from '@/components/features/estimates/view';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Estimate Details - ${config.appName}`,
};

interface EstimateDetailsPageProps {
  params: {
    id: string;
  };
}

export default function EstimateDetailsPage({ params }: EstimateDetailsPageProps) {
  const id = parseInt(params.id, 10);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <EstimateDetailsView id={id} />
    </div>
  );
}
