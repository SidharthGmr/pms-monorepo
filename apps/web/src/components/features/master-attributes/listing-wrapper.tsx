'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import MasterAttributeList from '.';
import ManageMasterAttribute from './add-edit';

export default function MasterAttributeListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Master Attributes"
        description="Groups of reusable values — Size, Color, Weight — used across the app"
        variant="add"
        actionText="Add Attribute"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <MasterAttributeList />
      </Card>
      {showAddModal && <ManageMasterAttribute isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
