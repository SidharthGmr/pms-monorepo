import DashboardSwitcher from '@/components/admin-home/DashboardSwitcher';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Dashboard - ${config.appName}`,
};

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <DashboardSwitcher />
    </div>
  );
}
