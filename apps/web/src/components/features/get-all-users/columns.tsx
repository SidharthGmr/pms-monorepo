'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserDto } from '@/dtos/UserDto';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { BsEnvelope, BsPhone } from 'react-icons/bs';
import { GoCheckCircleFill } from 'react-icons/go';
import { IoMdCloseCircle } from 'react-icons/io';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import ECardListRowActions from './row-action';
import ActiveStatusToggle from '@/components/common/active-status-toggle';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

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
        accessorKey: 'name',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="User" />,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-1 ring-border ring-offset-2 ring-offset-background">
                {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} className="object-cover" alt={user.name} />}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold uppercase text-primary">{user?.name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">@{user.role}</span>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name' },
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
            <div className="min-w-[220px] space-y-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BsEnvelope size={12} className="shrink-0" />
                <span className="truncate text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BsPhone size={12} className="shrink-0" />
                <span>{user.phone || '—'}</span>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'email' },
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
        id: 'verification',
        accessorKey: 'isEmailVerified',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Verification" />,
        cell: ({ row }) =>
          row.original.isEmailVerified ? (
            <Badge variant="green" className="flex items-center gap-1">
              <GoCheckCircleFill size={12} />
              Verified
            </Badge>
          ) : (
            <Badge variant="orange" className="flex items-center gap-1">
              Pending
            </Badge>
          ),
        meta: { sortingKey: 'isEmailVerified' },
      },
      {
        id: 'lastActive',
        accessorKey: 'tokenUpdated',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Last Active" />,
        cell: ({ row }) => {
          const tokenUpdated = row.original.tokenUpdated;
          if (!tokenUpdated) {
            return <span className="text-muted-foreground text-xs">Never</span>;
          }
          return (
            <span className="text-xs tabular-nums text-muted-foreground">{unitOfService.DateTimeService.convertToLocalDate(tokenUpdated, true)}</span>
          );
        },
        meta: { sortingKey: 'tokenUpdated' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => (
          <div className="flex justify-center">
            <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase text-center" title="Status" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.status ? (
              <GoCheckCircleFill size={18} className="text-emerald-500" />
            ) : (
              <IoMdCloseCircle size={18} className="text-red-500" />
            )}
          </div>
        ),
        meta: { sortingKey: 'status' },
      },
    ],
    [editRecord, deleteRecord]
  );
