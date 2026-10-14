import CmsPagesListingWrapper from '@/components/features/cms-pages/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Pages - ${config.appName}`,
};

export default function AdminCmsPagesPage() {
  return <CmsPagesListingWrapper />;
}
