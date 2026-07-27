import CheckoutPage from '@/components/features/checkout';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Checkout - ${config.appName}`,
};

export default function Checkout() {
  return <CheckoutPage />;
}
