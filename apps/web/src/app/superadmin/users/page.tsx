import GetAllUsersListingWrapper from '@/components/features/get-all-users/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Users - ${config.appName}`,
};

export default function UsersPage() {
  return <GetAllUsersListingWrapper />;
}
