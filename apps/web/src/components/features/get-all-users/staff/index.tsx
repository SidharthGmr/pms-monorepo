'use client';

import { InfoRow } from '@/components/common/profile-components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { Roles } from '@/enums/roles.enum';
import { useGetStaffByUserId } from '@/hooks/service-hooks/useStaffService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { AxiosError } from 'axios';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import ManageStaff from './add-edit';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const dash = (value?: string | number | null) => (value?.toString().trim() ? value : '—');

const money = (amount?: number | null) =>
  amount == null ? '—' : `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function StaffDetails({ userId }: { userId: string }) {
  const { data: getStaffResponse, isLoading, isError, error, refetch } = useGetStaffByUserId(userId);
  const staff = getStaffResponse?.data?.data;

  const [showEditModal, setShowEditModal] = useState(false);
  // Editing a staff posting is an admin action, matching the guards on the staff endpoints.
  const { currentUser } = useGetCurrentUser();
  const canEdit = currentUser?.role === Roles.SUPER_ADMIN || currentUser?.role === Roles.ADMIN;

  const date = (value?: Date | string | null, withTime = false) =>
    value ? unitOfService.DateTimeService.convertToLocalDate(value as Date, withTime) : '—';

  if (isLoading) {
    return (
      <>
        {[...Array(6)].map((_, index) => (
          <Skeleton key={index} className="h-9 rounded-lg" />
        ))}
      </>
    );
  }

  // The API answers 404 when the user has no staff row, which is a normal state here, not a
  // failure - only anything else is worth showing as an error.
  const notFound = (error as AxiosError)?.response?.status === 404;

  if (isError && !notFound) {
    return <p className="text-xs text-destructive sm:col-span-2">Could not load the staff record.</p>;
  }

  if (!staff || notFound) {
    return <p className="text-xs text-muted-foreground sm:col-span-2">No staff record exists for this user yet.</p>;
  }

  return (
    <>
      <InfoRow label="Position" value={dash(staff.position)} />
      <InfoRow label="Department" value={dash(staff.department)} />
      <InfoRow label="Store" value={dash(staff.store?.name)} />
      <InfoRow label="Store code" value={<span className="font-mono text-[11px]">{dash(staff.storeCode)}</span>} />
      <InfoRow label="Hire date" value={date(staff.hireDate)} />
      <InfoRow label="Salary" value={money(staff.salary)} />
      <InfoRow label="Employment" value={<Badge variant={staff.isActive ? 'green' : 'rose'}>{staff.isActive ? 'Active' : 'Inactive'}</Badge>} />
      <InfoRow label="Staff ID" value={dash(staff.id)} />
      <InfoRow label="Added on" value={date(staff.createdAt, true)} />
      <InfoRow label="Last updated" value={date(staff.updatedAt, true)} />

      {canEdit && (
        <div className="flex justify-end pt-1 sm:col-span-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit staff details
          </Button>
        </div>
      )}

      {showEditModal && (
        <ManageStaff
          id={staff.id}
          isOpen={showEditModal}
          onClose={(refresh) => {
            setShowEditModal(false);
            if (refresh) refetch();
          }}
        />
      )}
    </>
  );
}
