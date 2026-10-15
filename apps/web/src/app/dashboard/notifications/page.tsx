import NotificationListingWrapper from '@/components/features/notifications/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Notifications - ${config.appName}`,
};

// Customers get order-status notifications, so the same feed serves the customer dashboard.
export default function DashboardNotificationsPage() {
  return (
    <div>
      <NotificationListingWrapper />
    </div>
  );
}
