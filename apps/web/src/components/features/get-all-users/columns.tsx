'use client';

import ActiveStatusToggle from '@/components/common/active-status-toggle';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { UserDto } from '@/dtos/UserDto';
import { Roles } from '@/enums/roles.enum';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { BsEnvelope, BsPhone } from 'react-icons/bs';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import ECardListRowActions from './row-action';
import UserTableDetail from '@/components/common/table-user-details';
import ActionTooltip from '@/components/common/tooltip-action-button';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

type BadgeVariant = BadgeProps['variant'];

const roleBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  [Roles.SUPER_ADMIN]: { label: 'Super Admin', variant: 'purple' },
  [Roles.ADMIN]: { label: 'Admin', variant: 'indigo' },
  [Roles.STAFF]: { label: 'Staff', variant: 'blue' },
  [Roles.USER]: { label: 'Customer', variant: 'zinc' },
};

const statusBadge: Record<string, BadgeVariant> = {
  [StatusValues.Published]: 'green',
  [StatusValues.Draft]: 'amber',
  [StatusValues.InReview]: 'blue',
  [StatusValues.Reject]: 'rose',
  [StatusValues.Trash]: 'zinc',
};

interface ContactLineProps {
  icon: React.ReactNode;
  value?: string | null;
  emptyLabel: string;
  verified: boolean;
  verifiedLabel: string;
}

function ContactLine({ icon, value, emptyLabel, verified, verifiedLabel }: ContactLineProps) {
  const title = `${verifiedLabel} ${verified ? 'verified' : 'not verified'}`;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`shrink-0 ${verified ? 'text-primary' : 'text-muted-foreground'}`}>{icon}</span>
      {value ? (
        <span className={`truncate transition-colors ${verified ? 'text-primary' : 'text-foreground'}`} title={title} aria-label={title}>
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground" title={title} aria-label={title}>
          {emptyLabel}
        </span>
      )}

      {/* {value &&
        (verified ? (
          <IoIosCheckmark size={12} className="ml-auto shrink-0 text-emerald-600 " title={title} aria-label={title} />
        ) : (
          <IoMdCloseCircle size={12} className="ml-auto shrink-0 text-muted-foreground/60" title={title} aria-label={title} />
        ))} */}
    </div>
  );
}

export const useUserColumns = (editRecord?: (id: string) => void, deleteRecord?: (id: string) => void) =>
  useMemo<ColumnDef<UserDto>[]>(
    () => [
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <ECardListRowActions
              row={row}
              editRecord={editRecord ? () => editRecord(row.original?.usersId) : () => {}}
              deleteRecord={deleteRecord ? () => deleteRecord(row.original?.usersId) : () => {}}
            />
          );
        },
      },
      {
        id: 'user',
        accessorKey: 'user',
        enableHiding: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="User Details" />,
        cell: ({ row }) => {
          const user = row.original;
          const fullName = [user.name].filter(Boolean).join(' ');

          return (
            <>
              <div className="">
                <UserTableDetail image={row.original.profileImageUrl} name={fullName} userId={row.original.usersId} email={row.original.email} />
              </div>
            </>
          );
        },
        meta: {
          sortingKey: 'email',
        },
      },

      {
        id: 'role',
        accessorKey: 'role',
        enableHiding: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => {
          const user = row.original;
          const role = roleBadge[user.role];
          return (
            <>
              <div className="">
                <Badge variant={role?.variant ?? 'zinc'} className="">
                  {role?.label ?? user.role}
                </Badge>
              </div>
            </>
          );
        },
        meta: {
          sortingKey: 'email',
        },
      },

      {
        id: 'contact',
        accessorKey: 'email',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Contact" />,
        cell: ({ row }) => {
          const user = row.original;

          return (
            <div className="min-w-[240px] max-w-[280px] space-y-1">
              <ContactLine
                icon={<BsEnvelope size={12} />}
                value={user.email}
                emptyLabel="No email"
                verified={user.isEmailVerified}
                verifiedLabel="Email"
              />
              <ContactLine
                icon={<BsPhone size={12} />}
                value={user.phone}
                emptyLabel="No phone"
                verified={user.isPhoneVerified}
                verifiedLabel="Phone"
              />
            </div>
          );
        },
        meta: { sortingKey: 'email' },
      },
      {
        id: 'lastActive',
        accessorKey: 'lastLoginAt',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Last Active" />,
        cell: ({ row }) => {
          const lastLoginAt = row.original.lastLoginAt;
          if (!lastLoginAt) {
            return <span className="text-xs text-muted-foreground">Never signed in</span>;
          }
          return (
            <span className="text-xs tabular-nums text-muted-foreground" title={unitOfService.DateTimeService.convertToLocalDate(lastLoginAt, true)}>
              {unitOfService.DateTimeService.convertToLocalDate(lastLoginAt, true)}
            </span>
          );
        },
        meta: { sortingKey: 'lastLoginAt' },
      },
      {
        id: 'actions-mobile',
        accessorKey: 'actions',
        enableHiding: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
        cell: ({ row }) => {
          return (
            <>
              <div className="flex items-center gap-2">
                <ActionTooltip variant="edit" tooltip="Edit Record" onClick={editRecord ? () => editRecord(row.original?.usersId) : () => {}} />
                <ActionTooltip
                  variant="delete"
                  tooltip="Delete Record"
                  onClick={deleteRecord ? () => deleteRecord(row.original?.usersId) : () => {}}
                />
              </div>
            </>
          );
        },
        meta: {
          sortingKey: 'actions',
        },
      },
      {
        id: 'activity',
        accessorKey: 'isActive',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Activity" />,
        cell: ({ row }) => <ActiveStatusToggle user={row.original} />,
        meta: { sortingKey: 'isActive' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => (
          <div className="flex justify-center">
            <DataTableColumnHeader column={column} className="text-center text-xs font-semibold uppercase" title="Status" />
          </div>
        ),
        cell: ({ row }) => {
          // The API sends the `Status` enum ("Published", "Draft", ...) even though `UserDto`
          // declares a boolean, so a truthy check painted every row green.
          const status = String(row.original.status ?? '');

          return (
            <div className="flex justify-center">
              {status ? <Badge variant={statusBadge[status] ?? 'zinc'}>{status}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
            </div>
          );
        },
        meta: { sortingKey: 'status' },
      },
    ],
    [editRecord, deleteRecord]
  );
