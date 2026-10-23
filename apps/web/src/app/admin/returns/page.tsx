import OrderReturnListingWrapper from '@/components/features/order-returns/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Returns - ${config.appName}`,
};

export default function ReturnsPage() {
  return <OrderReturnListingWrapper />;
}
