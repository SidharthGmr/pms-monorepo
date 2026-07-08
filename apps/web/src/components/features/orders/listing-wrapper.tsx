'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import OrderList from '.';
import ManageOrder from './add-edit';


export default function OrderListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader title="Orders" description="Manage customer orders" variant="add" actionText="Add Order" onClick={() => setShowAddModal(true)} />
      <Card>
        <OrderList />
      </Card>
      {showAddModal && <ManageOrder isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
