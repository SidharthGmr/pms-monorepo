import EstimateForm from '@/components/features/estimates/estimate-form';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Edit Estimate - ${config.appName}`,
};

interface EditEstimatePageProps {
  params: {
    id: string;
  };
}

export default function EditEstimatePage({ params }: EditEstimatePageProps) {
  const id = parseInt(params.id, 10);

  return (
    <div className="grid gap-5">
      <EstimateForm id={id} />
    </div>
  );
}
