import OrderListingWrapper from '@/components/features/orders/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Order List - ${config.appName}`,
};

export default function OrdersPage() {
  return (
    <div className="grid gap-5">
      <OrderListingWrapper />
    </div>
  );
}
