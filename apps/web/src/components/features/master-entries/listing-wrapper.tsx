'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import MasterEntryList from '.';
import ManageMasterEntry from './add-edit';

export default function MasterEntryListingWrapper() {
  const searchParams = useSearchParams();
  // Arriving from the attributes screen pre-selects that group in the add form.
  const attributeId = searchParams.get('attributeId') ? +searchParams.get('attributeId')! : undefined;
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Master Entries"
        description="Values behind each attribute — sizes, colours, weights"
        variant="add"
        actionText="Add Value"
        onClick={() => setShowAddModal(true)}
      />
      <Card>
        <MasterEntryList />
      </Card>
      {showAddModal && <ManageMasterEntry defaultAttributeId={attributeId} isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
    </>
  );
}
