'use client';
import ActiveStatusToggle from '@/components/common/active-status-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { UserDto } from '@/dtos/UserDto';
import { Roles } from '@/enums/roles.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { BsEnvelope, BsPhone } from 'react-icons/bs';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { Badge } from '../../ui/badge';
import { UserRowActions } from './row-action';

// Roles read faster when each keeps its own colour across the table.
const roleVariant = (role?: string): 'violet' | 'indigo' | 'teal' | 'zinc' => {
  switch (role) {
    case Roles.SUPER_ADMIN:
      return 'violet';
    case Roles.ADMIN:
    case Roles.Administrator:
      return 'indigo';
    case Roles.STAFF:
      return 'teal';
    default:
      return 'zinc';
  }
};

export const useUserColumns = (editRecord?: (id: string) => void, deleteRecord?: (id: string) => void) =>
  useMemo<ColumnDef<UserDto>[]>(
    () => [
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <UserRowActions row={row} editRecord={editRecord} deleteRecord={deleteRecord} />,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Name" />,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border ring-offset-2 ring-offset-background">
                {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} className="object-cover" alt={user.name} />}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold uppercase text-primary">{user.name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">@{user.userName}</span>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'name' },
      },
      {
        id: 'contact',
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Contact" />,
        cell: ({ row }) => (
          <div className="min-w-[200px] space-y-1 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BsEnvelope size={12} className="shrink-0" />
              <span className="truncate text-foreground">{row.original.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BsPhone size={12} className="shrink-0" />
              <span>{row.original.phone || '—'}</span>
            </div>
          </div>
        ),
        meta: { sortingKey: 'email' },
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Role" />,
        cell: ({ row }) => <Badge variant={roleVariant(row.original.role)}>{row.original.role}</Badge>,
        meta: { sortingKey: 'role' },
      },
      {
        id: 'storeCode',
        accessorKey: 'storeCode',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Store Code" />,
        cell: ({ row }) =>
          row.original.storeCode ? (
            <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium uppercase">{row.original.storeCode}</code>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        meta: { sortingKey: 'storeCode' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Created At" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {row.original.createdAt ? unitOfService.DateTimeService.convertToLocalDate(row.original.createdAt, true) : '—'}
            </span>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'isActive',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <ActiveStatusToggle user={row.original} />,
        meta: { sortingKey: 'isActive' },
      },
    ],
    [deleteRecord, editRecord]
  );
