'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CategoryDto } from '@/dtos/category.dto';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { Folder } from 'lucide-react';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

export const useCategoryColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<CategoryDto>[]>(
    () => [
      {
        id: 'actions',
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="text-xs font-semibold uppercase text-muted-foreground">Action</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ActionTooltip variant="edit" tooltip="Edit category" onClick={() => editRecord(+row.original.id)} />
            <ActionTooltip variant="delete" tooltip="Delete category" onClick={() => deleteRecord(+row.original.id)} />
          </div>
        ),
      },
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Folder className="h-4 w-4" />
            </div>
            <span className="font-medium text-foreground">{row.original.name}</span>
          </div>
        ),
        meta: { sortingKey: 'name' },
      },
      {
        id: 'description',
        accessorKey: 'description',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Description" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description ?? '—'}</span>,
        meta: { sortingKey: 'description' },
      },
      {
        id: 'parentId',
        accessorKey: 'parentId',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Parent ID" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.parentId ?? '—'}</span>,
        meta: { sortingKey: 'parentId' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <Badge variant={row.original.status === StatusValues.Published ? 'green' : 'orange'}>{row.original.status}</Badge>,
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
