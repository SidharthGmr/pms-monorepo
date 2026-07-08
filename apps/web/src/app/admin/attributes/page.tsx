import AttributeListingWrapper from '@/components/features/attributes/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Attribute List- ${config.appName}`,
};

export default function AttributesPage() {
  return (
    <div className="grid  gap-5">
      <AttributeListingWrapper />
    </div>
  );
}
