import StoreListingWrapper from '@/components/features/stores/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Stores - ${config.appName}`,
};

export default function StoresPage() {
  return (
    <div className="grid gap-5">
      <StoreListingWrapper />
    </div>
  );
}
