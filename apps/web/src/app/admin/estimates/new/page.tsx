import EstimateForm from '@/components/features/estimates/estimate-form';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `New Estimate - ${config.appName}`,
};

export default function NewEstimatePage() {
  return (
    <div className="grid gap-5">
      <EstimateForm />
    </div>
  );
}
