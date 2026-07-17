import AdminProfilePage from '@/components/features/profile/AdminProfilePage';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Edit Profile - ${config.appName}`,
};

export default function ProfilePage() {
  return <AdminProfilePage />;
}
