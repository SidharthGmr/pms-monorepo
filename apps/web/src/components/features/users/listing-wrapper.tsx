'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import UserList from '.';

export default function UserListingWrapper() {
  return (
    <>
      <PageHeader title="Users" description="Manage users associated with your store" />
      <Card>
        <UserList />
      </Card>
    </>
  );
}
