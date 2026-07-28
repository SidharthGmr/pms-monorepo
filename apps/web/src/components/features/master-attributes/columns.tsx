'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { MasterAttributeDto } from '@/dtos/master-entry.dto';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

export const useMasterAttributeColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<MasterAttributeDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ActionTooltip variant="edit" tooltip="Edit Record" onClick={() => editRecord(+row.original.id)} />
            <ActionTooltip variant="delete" tooltip="Delete Record" onClick={() => deleteRecord(+row.original.id)} />
          </div>
        ),
      },
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Attribute" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && <span className="text-xs text-muted-foreground">{row.original.description}</span>}
          </div>
        ),
        meta: { sortingKey: 'name' },
      },
      {
        id: 'code',
        accessorKey: 'code',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Code" />,
        cell: ({ row }) => (
          <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium uppercase">{row.original.code}</code>
        ),
        meta: { sortingKey: 'code' },
      },
      {
        id: 'unit',
        accessorKey: 'unit',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Unit" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.unit || '—'}</span>,
      },
      {
        id: 'entryCount',
        accessorKey: 'entryCount',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Values" />,
        // Deep-links into the entries screen pre-filtered to this attribute.
        cell: ({ row }) => (
          <Link
            href={`/admin/master-entries?attributeId=${row.original.id}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.entryCount ?? 0} {row.original.entryCount === 1 ? 'value' : 'values'}
          </Link>
        ),
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'displayOrder',
        accessorKey: 'displayOrder',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Display Order" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.displayOrder ?? '—'}</span>,
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <Badge variant={row.original.status === StatusValues.Published ? 'green' : 'orange'}>{row.original.status}</Badge>,
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Created At" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {row.original.createdAt ? unitOfService.DateTimeService.convertToLocalDate(row.original.createdAt as unknown as Date, true) : '—'}
            </span>
          );
        },
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Updated At" />,
        // Null until the row is first edited, so an em-dash is the normal state here.
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          return (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {row.original.updatedAt ? unitOfService.DateTimeService.convertToLocalDate(row.original.updatedAt as unknown as Date, true) : '—'}
            </span>
          );
        },
      },
    ],
    [editRecord, deleteRecord]
  );
