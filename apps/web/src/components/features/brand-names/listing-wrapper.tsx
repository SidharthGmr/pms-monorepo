'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import BrandNameList from '.';
import ManageBrandName from './add-edit';
import { PageHeader } from '@/components/common/page-header';

export default function BrandNameListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Brand Names"
        description="Manage product brand names"
        variant="add"
        actionText="Add Brand Name"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <BrandNameList />
      </Card>
      {showAddModal && <ManageBrandName isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
