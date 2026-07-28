import MasterEntryListingWrapper from '@/components/features/master-entries/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Master Entries - ${config.appName}`,
};

export default function MasterEntriesPage() {
  return (
    <div className="grid gap-5">
      <MasterEntryListingWrapper />
    </div>
  );
}
