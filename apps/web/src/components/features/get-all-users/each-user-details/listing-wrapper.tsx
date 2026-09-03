'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import EachUserDetails from '.';

export default function EachUserWrapper({ userId }: { userId: string }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="User Details" description="Account, contact and profile details for this user." variant="back" />
      <Card>
        <EachUserDetails userId={userId} />
      </Card>
    </div>
  );
}
