import GetAllUsersListingWrapper from '@/components/features/get-all-users/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Users List - ${config.appName}`,
};

export default function UsersPage() {
  return (
    <div className="grid gap-5">
      <GetAllUsersListingWrapper />
    </div>
  );
}
