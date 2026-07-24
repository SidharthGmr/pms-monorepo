'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import GetAllUserss from '.';
import ManageUser from './add-edit';

export default function GetAllUsersListingWrapper({ role }: { role?: string }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${role ? 'Customers' : 'All Users'}`}
        description={role ? 'Manage your store customers.' : 'Manage user accounts, roles, and access.'}
        variant="add"
        actionText={role ? 'Add Customer' : 'Add User'}
        onClick={() => setShowAddModal(true)}
      />
      <Card className="overflow-hidden">
        <GetAllUserss role={role} />
      </Card>

      {showAddModal && <ManageUser isOpen={showAddModal} onClose={() => setShowAddModal(false)} role={role} />}
    </div>
  );
}
