import SettingsPage from '@/components/features/settings';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Settings - ${config.appName}`,
};

export default function AdminSettingsPage() {
  return (
    <div className="grid gap-5">
      <SettingsPage />
    </div>
  );
}
