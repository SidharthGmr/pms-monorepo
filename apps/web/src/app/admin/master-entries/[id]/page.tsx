import MasterEntryList from '@/components/features/master-entries';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Order Details - ${config.appName}`,
};

interface OrderDetailsPageProps {
  params: {
    id: string;
  };
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const id = parseInt(params.id, 10);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MasterEntryList attributeId={id} />
    </div>
  );
}
