import { PageHeader } from '@/components/common/page-header';
import ReceiveStockPage from '@/components/features/receive-stock';
import { Metadata } from 'next';
import config from '@/config';

export const metadata: Metadata = {
  title: `Receive Stock - ${config.appName}`,
};

export default function ReceiveStock() {
  return (
    <div className="mx-auto space-y-6">
      <ReceiveStockPage />
    </div>
  );
}
