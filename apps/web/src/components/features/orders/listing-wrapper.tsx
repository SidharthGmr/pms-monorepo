'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';
import { useCallback, useState } from 'react';
import OrderList from '.';
import ManageOrder from './add-edit';

export default function OrderListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const handleCount = useCallback((value: number) => setTotal(value), []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={Receipt}
        title="Invoices"
        description={
          total === undefined ? 'Every sale billed from this store' : `${total} ${total === 1 ? 'invoice' : 'invoices'} · every sale billed from this store`
        }
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            New invoice
          </Button>
        }
      />

      <OrderList onCountChange={handleCount} />

      {showAddModal && <ManageOrder isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
