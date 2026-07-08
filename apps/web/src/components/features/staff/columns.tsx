'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { useMemo } from 'react';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { StaffDto } from '@/dtos/staff.dto';
import { Badge } from '../../ui/badge';
import StaffListRowActions from './row-action';
import ActionTooltip from '@/components/common/tooltip-action-button';

export const useStaffColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<StaffDto>[]>(
    () => [
      {
        id: 'actions-mobile',
        accessorKey: 'actions',
        enableHiding: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
        cell: ({ row }) => {
          return (
            <>
              <div className="flex items-center gap-2">
                <ActionTooltip
                  variant="edit"
                  tooltip="Edit Record"
                  onClick={() => {
                    editRecord(+row.original.id);
                  }}
                />

                <ActionTooltip
                  variant="delete"
                  tooltip="Delete Record"
                  onClick={() => {
                    deleteRecord(+row.original.id);
                  }}
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
        id: 'user',
        accessorKey: 'userId',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Staff Member" />,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-medium block">{row.original.user?.name || `User #${row.original.userId}`}</span>
            {row.original.user?.email && <span className="text-xs text-muted-foreground">{row.original.user.email}</span>}
            {row.original.user?.phone && <span className="text-xs text-muted-foreground block">{row.original.user.phone}</span>}
          </div>
        ),
        meta: { sortingKey: 'userId' },
      },
      {
        id: 'store',
        accessorKey: 'storeId',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Store" />,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-medium block">{row.original.store?.name || `Store #${row.original.storeId}`}</span>
            {row.original.store?.code && <span className="text-xs text-muted-foreground">Code: {row.original.store.code}</span>}
          </div>
        ),
        meta: { sortingKey: 'storeId' },
      },
      {
        id: 'position',
        accessorKey: 'position',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Position" />,
        cell: ({ row }) => <span>{row.original.position || '-'}</span>,
        meta: { sortingKey: 'position' },
      },
      {
        id: 'department',
        accessorKey: 'department',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Department" />,
        cell: ({ row }) => <span>{row.original.department || '-'}</span>,
        meta: { sortingKey: 'department' },
      },
      {
        id: 'salary',
        accessorKey: 'salary',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Salary" />,
        cell: ({ row }) => <span className="font-medium">{row.original.salary != null ? `$${row.original.salary.toFixed(2)}` : '-'}</span>,
        meta: { sortingKey: 'salary' },
      },
      {
        id: 'hireDate',
        accessorKey: 'hireDate',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Hire Date" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="text-sm text-muted-foreground">
              {row.original.hireDate ? unitOfService.DateTimeService.convertToLocalDate(row.original.hireDate, true) : '-'}
            </span>
          );
        },
        meta: { sortingKey: 'hireDate' },
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <Badge variant={row.original.isActive ? true : false}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>,
        meta: { sortingKey: 'isActive' },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <StaffListRowActions row={row} editRecord={editRecord} deleteRecord={deleteRecord} />,
      },
    ],
    [editRecord, deleteRecord]
  );
