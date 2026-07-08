'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import GetAllUserss from '.';
import ManageUser from './add-edit';

export default function GetAllUsersListingWrapper({ role }: { role?: string }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      {role}
      <PageHeader
        title={`${role ? 'Customer' : 'All Users'} List`}
        variant="add"
        actionText="Add User"
        onClick={() => setShowAddModal(true)}
      />
      <Card className="overflow-hidden space-y-4">
        <GetAllUserss role={role} />
      </Card>

      {showAddModal && <ManageUser isOpen={showAddModal} onClose={() => setShowAddModal(false)} role={role} />}
    </>
  );
}
