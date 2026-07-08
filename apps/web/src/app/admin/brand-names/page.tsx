import BrandNameListingWrapper from '@/components/features/brand-names/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Brand Names - ${config.appName}`,
};

export default function BrandNamesPage() {
  return (
    <div className="grid gap-5">
      <BrandNameListingWrapper />
    </div>
  );
}
