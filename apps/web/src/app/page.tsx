import Storefront from '@/components/storefront';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stocklivo - Your online store. Every product tracked.',
  description: 'Browse the full catalogue with live prices and real stock counts on every product.',
};

export default function Page() {
  return <Storefront />;
}

