'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { Roles } from '@/enums/roles.enum';
import { useState } from 'react';
import StaffList from '.';
import ManageUser from '../get-all-users/add-edit';

export default function StaffListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title={`Staff Members`}
        description="Manage staff members"
        variant="add"
        actionText="Add Staff"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <StaffList />
      </Card>
      {showAddModal && <ManageUser isOpen={showAddModal} onClose={() => setShowAddModal(false)} role={Roles.STAFF} />}
    </>
  );
}
