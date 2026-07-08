'use client';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { UserDto } from '@/dtos/UserDto';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { Badge } from '../../ui/badge';
import { UserRowActions } from './row-action';

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
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-medium block">{row.original.name}</span>
            <span className="text-xs text-muted-foreground block">@{row.original.userName}</span>
            <span className="text-xs text-muted-foreground block">@{row.original.role}</span>
          </div>
        ),
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Email" />,
        cell: ({ row }) => <span>{row.original.email}</span>,
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Phone" />,
        cell: ({ row }) => <span>{row.original.phone || '—'}</span>,
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Role" />,
        cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
      },
      {
        id: 'storeCode',
        accessorKey: 'storeCode',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Store Code" />,
        cell: ({ row }) => <span>{row.original.storeCode || '—'}</span>,
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
            <span className="text-sm text-muted-foreground">
              {row.original.createdAt ? unitOfService.DateTimeService.convertToLocalDate(row.original.createdAt, true) : '—'}
            </span>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? true : false}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ],
    [deleteRecord, editRecord]
  );
