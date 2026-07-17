import SupplierListingWrapper from '@/components/features/suppliers/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Suppliers - ${config.appName}`,
};

export default function SuppliersPage() {
  return (
    <div className="grid gap-5">
      <SupplierListingWrapper />
    </div>
  );
}
