import NotificationListingWrapper from '@/components/features/notifications/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Notifications - ${config.appName}`,
};

export default function AdminNotificationsPage() {
  return (
    <div>
      <NotificationListingWrapper />
    </div>
  );
}
