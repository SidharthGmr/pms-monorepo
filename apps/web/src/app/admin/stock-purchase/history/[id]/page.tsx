import PurchaseDetailsView from '@/components/features/purchases/view';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Purchase Details - ${config.appName}`,
};

interface PurchaseDetailsPageProps {
  params: {
    id: string;
  };
}

export default function PurchaseDetailsPage({ params }: PurchaseDetailsPageProps) {
  const id = parseInt(params.id, 10);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PurchaseDetailsView id={id} />
    </div>
  );
}
