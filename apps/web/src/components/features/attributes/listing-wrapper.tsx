'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import AttributeList from '.';
import ManageAttribute from './add-edit';

export default function AttributeListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title={`Attributes`}
        description="Manage product attributes (name &amp; unit)"
        variant="add"
        actionText="Add Attribute"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <AttributeList />
      </Card>
      {showAddModal && <ManageAttribute isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
