'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { SupplierDto } from '@/dtos/supplier.dto';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import SupplierRowActions from './row-action';

export const useSupplierColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<SupplierDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => <SupplierRowActions row={row} editRecord={editRecord} deleteRecord={deleteRecord} />,
      },
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Supplier" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            {row.original.contactPerson && <span className="text-xs text-muted-foreground">{row.original.contactPerson}</span>}
          </div>
        ),
        meta: { sortingKey: 'name' },
      },
      {
        id: 'actions-mobile',
        accessorKey: 'actions',
        enableHiding: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ActionTooltip variant="edit" tooltip="Edit Record" onClick={() => editRecord(+row.original.id)} />
            <ActionTooltip variant="delete" tooltip="Delete Record" onClick={() => deleteRecord(+row.original.id)} />
          </div>
        ),
        meta: { sortingKey: 'actions' },
      },
      {
        id: 'email',
        accessorKey: 'email',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Email" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email || '—'}</span>,
        meta: { sortingKey: 'email' },
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Phone" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.phone || '—'}</span>,
        meta: { sortingKey: 'phone' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <Badge variant={row.original.status === StatusValues.Published ? 'scusses' : 'orange'}>{row.original.status}</Badge>,
        meta: { sortingKey: 'status' },
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
        meta: { sortingKey: 'createdAt' },
      },
    ],
    [editRecord, deleteRecord]
  );
