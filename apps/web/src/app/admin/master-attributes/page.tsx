import MasterAttributeListingWrapper from '@/components/features/master-attributes/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Master Attributes - ${config.appName}`,
};

export default function MasterAttributesPage() {
  return (
    <div className="grid gap-5">
      <MasterAttributeListingWrapper />
    </div>
  );
}
