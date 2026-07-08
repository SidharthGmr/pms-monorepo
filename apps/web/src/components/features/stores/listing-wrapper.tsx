'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import StoreList from '.';
import ManageStore from './add-edit';
import { PageHeader } from '@/components/common/page-header';

export default function StoreListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader title="Stores" description="Manage store locations" variant="add" actionText="Add Store" onClick={() => setShowAddModal(true)} />
      <Card>
        <StoreList />
      </Card>
      {showAddModal && <ManageStore isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
