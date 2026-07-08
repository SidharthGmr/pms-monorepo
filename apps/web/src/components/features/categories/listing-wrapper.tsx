'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import CategoryList from '.';
import ManageCategory from './add-edit';
import { PageHeader } from '@/components/common/page-header';

export default function CategoryListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title={`Categories`}
        description="Manage product categories"
        variant="add"
        actionText="Add Category"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <CategoryList />
      </Card>
      {showAddModal && <ManageCategory isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
