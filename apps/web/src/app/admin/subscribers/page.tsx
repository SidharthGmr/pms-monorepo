import SubscriberListingWrapper from '@/components/features/subscribers/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Subscribers - ${config.appName}`,
};

export default function SubscribersPage() {
  return (
    <div>
      <SubscriberListingWrapper />
    </div>
  );
}
