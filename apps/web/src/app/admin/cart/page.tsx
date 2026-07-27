import CartPage from '@/components/features/cart';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Cart - ${config.appName}`,
};

export default function Cart() {
  return <CartPage />;
}
