import GetAllUsersListingWrapper from '@/components/features/get-all-users/listing-wrapper';
import config from '@/config';
import { Roles } from '@/enums/roles.enum';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Users List - ${config.appName}`,
};

export default function CustomerPage() {
  return (
    <div className="grid gap-5">
      <GetAllUsersListingWrapper role={Roles.USER} />
    </div>
  );
}
