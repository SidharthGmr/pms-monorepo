import DashboardSummary from '@/components/admin-home/DashboardSummary';
import config from '@/config';
import { UserDto } from '@/dtos/UserDto';
import { Roles } from '@/enums/roles.enum';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/options';

export const metadata: Metadata = {
  title: `User List- ${config.appName}`,
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const user = session.user as UserDto;
    if (user.role === Roles.ADMIN) {
      console.log('Admin access granted');
      console.log('user', user?.storeCode);
    } else {
      console.log('Admin access not granted');
    }
  }

  return (
    <div className="space-y-6">
      <DashboardSummary />
    </div>
  );
}
