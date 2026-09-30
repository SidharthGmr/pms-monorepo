'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { BrandNameDto } from '@pms/types';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import BrandNameRowActions from './row-action';

export const useBrandNameColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<BrandNameDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => <BrandNameRowActions row={row} editRecord={editRecord} deleteRecord={deleteRecord} />,
      },
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Brand Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
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
        id: 'status',
        accessorKey: 'status',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => (
          <Badge variant={row.original.status === StatusValues.Published ? 'green' : row.original.status === StatusValues.Trash ? 'destructive' : 'orange'}>
            {row.original.status}
          </Badge>
        ),
        meta: { sortingKey: 'status' },
      },

      {
        id: 'displayOrder',
        accessorKey: 'displayOrder',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Display Order" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.displayOrder ?? '—'}</span>,
        meta: { sortingKey: 'displayOrder' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Created At" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="text-sm text-muted-foreground">
              {row.original.createdAt ? unitOfService.DateTimeService.convertToLocalDate(new Date(row.original.createdAt), true) : '—'}
            </span>
          );
        },
        meta: { sortingKey: 'createdAt' },
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Updated At" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="text-sm text-muted-foreground">
              {row.original.updatedAt ? unitOfService.DateTimeService.convertToLocalDate(new Date(row.original.updatedAt), true) : '—'}
            </span>
          );
        },
        meta: { sortingKey: 'updatedAt' },
      },
    ],
    [editRecord, deleteRecord]
  );
