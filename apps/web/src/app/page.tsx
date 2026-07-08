import EKarobarHome from '@/components/home/eKarobarHome';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eKarobar - Manage Your Business Anytime, Anywhere',
  description: 'Track invoices, payments, expenses, and taxes with our automated financial dashboard.',
};

export default function Page() {
  return <EKarobarHome />;
}

