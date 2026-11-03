import NewSale from '@/components/features/orders/new-sale';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `New Sale - ${config.appName}`,
};

export default function NewSalePage() {
  return (
    <div className="grid gap-5">
      <NewSale />
    </div>
  );
}
