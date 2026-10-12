import AdminMediaDashboard from '@/components/common/admin-media/media-dashboard';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `File Manager List - ${config.appName}`,
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <AdminMediaDashboard />
    </div>
  );
}
