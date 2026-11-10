import DashboardSwitcher from '@/components/admin-home/DashboardSwitcher';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Dashboard - ${config.appName}`,
};

export default function AdminPage() {
  return (
    <div>
      <DashboardSwitcher />
    </div>
  );
}
