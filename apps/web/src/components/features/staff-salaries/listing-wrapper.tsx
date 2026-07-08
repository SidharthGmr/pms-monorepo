'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import ManageStaffSalary from './add-edit';
import { PageHeader } from '@/components/common/page-header';
import StaffSalaryList from '.';

export default function StaffSalaryListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title={`Staff Salaries`}
        description="Manage staff salary records"
        variant="add"
        actionText="Add Salary Record"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <StaffSalaryList />
      </Card>

      {showAddModal && <ManageStaffSalary isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
