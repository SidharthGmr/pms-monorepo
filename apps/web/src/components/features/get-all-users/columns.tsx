'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserDto } from '@/dtos/UserDto';
import { ColumnDef } from '@tanstack/react-table';
import { Dot } from 'lucide-react';
import { useMemo } from 'react';
import { BsEnvelope, BsPhone } from 'react-icons/bs';
import { GoCheckCircleFill } from 'react-icons/go';
import { IoMdCloseCircle } from 'react-icons/io';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import ECardListRowActions from './row-action';


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
              editRecord={editRecord ? () => editRecord(row.original?.usersId) : () => { }}
              deleteRecord={deleteRecord ? () => deleteRecord(row.original?.usersId) : () => { }} />
          );
        },
      },
      {
        id: 'user',
        accessorKey: 'name',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="User" />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="w-[30px] h-[30px] ring-1 ring-green-500 ring-offset-[2px] ring-offset-background">
                {user?.profileImageUrl && (
                  <AvatarImage src={user.profileImageUrl} className="object-cover" alt={user.name} />
                )}
                <AvatarFallback className="uppercase bg-primary text-primary-foreground">
                  {user?.name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-medium">{user.name}</span>
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Contact" />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="space-y-1 text-xs min-w-[220px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BsEnvelope size={12} />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BsPhone size={12} />
                <span>{user.phone}</span>
              </div>
              <span className="text-xs text-muted-foreground block">@{row.original.role}</span>
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Activity" />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'cyan' : 'blue'}>
            <Dot className={row.original.isActive ? 'text-green-500' : 'text-gray-400'} />
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        meta: { sortingKey: 'isActive' },
      },
      {
        id: 'verification',
        accessorKey: 'isEmailVerified',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Verification" />
        ),
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Last Active" />
        ),
        cell: ({ row }) => {
          const tokenUpdated = row.original.tokenUpdated;
          if (!tokenUpdated) {
            return <span className="text-muted-foreground text-xs">Never</span>;
          }
          return (
            <span className="text-xs tabular-nums text-muted-foreground">
              {unitOfService.DateTimeService.convertToLocalDate(tokenUpdated, true)}
            </span>
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
      }

    ],
    [editRecord, deleteRecord]
  );
