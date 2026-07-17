'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import SupplierList from '.';
import ManageSupplier from './add-edit';
import { PageHeader } from '@/components/common/page-header';

export default function SupplierListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Manage your suppliers and their contact details"
        variant="add"
        actionText="Add Supplier"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <SupplierList />
      </Card>
      {showAddModal && <ManageSupplier isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
