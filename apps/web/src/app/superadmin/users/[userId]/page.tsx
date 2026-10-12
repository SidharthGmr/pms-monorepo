import EachUserWrapper from '@/components/features/get-all-users/each-user-details/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `User Details - ${config.appName}`,
};

export default async function StudentPage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  return (
    <>
      <EachUserWrapper userId={userId} />
    </>
  );
}
