'use client';
import ListPageHeader from '@/components/common/list-page-header';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import GetAllUserss from '.';
import ManageUser from './add-edit';

export default function GetAllUsersListingWrapper({ role }: { role?: string }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ListPageHeader
        icon={Users}
        title={role ? 'Customers' : 'Users'}
        description={role ? 'Everyone who shops with this store' : 'Accounts, roles and who can sign in'}
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            {role ? 'Add customer' : 'Add user'}
          </Button>
        }
      />

      <GetAllUserss role={role} />

      {showAddModal && <ManageUser isOpen={showAddModal} onClose={() => setShowAddModal(false)} role={role} />}
    </div>
  );
}
