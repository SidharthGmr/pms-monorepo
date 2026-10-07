'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Plus, Ruler } from 'lucide-react';
import { useCallback, useState } from 'react';
import AttributeList from '.';
import ManageAttribute from './add-edit';

export default function AttributeListingWrapper() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const handleCount = useCallback((value: number) => setTotal(value), []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={Ruler}
        title="Attributes"
        description={
          total === undefined
            ? 'The measurable facts a product can carry, like material or weight'
            : `${total} ${total === 1 ? 'attribute' : 'attributes'} · the measurable facts a product can carry`
        }
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add attribute
          </Button>
        }
      />

      <AttributeList onCountChange={handleCount} />

      {showAddModal && <ManageAttribute isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
