'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { MasterEntryDto } from '@/dtos/master-entry.dto';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

export const useMasterEntryColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<MasterEntryDto>[]>(
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
        id: 'attribute',
        accessorKey: 'attribute',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Attribute" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.attribute?.name || `#${row.original.attributeId}`}</span>
            {row.original.attribute?.code && (
              <code className="font-mono text-xs text-muted-foreground">{row.original.attribute.code}</code>
            )}
          </div>
        ),
      },
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Label" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.colorHex && (
              <span
                className="h-4 w-4 shrink-0 rounded-full border"
                style={{ backgroundColor: row.original.colorHex }}
                title={row.original.colorHex}
              />
            )}
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
        meta: { sortingKey: 'name' },
      },
      {
        id: 'value',
        accessorKey: 'value',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Stored Value" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium">{row.original.value}</code>
            {row.original.attribute?.unit && <span className="text-xs text-muted-foreground">{row.original.attribute.unit}</span>}
          </div>
        ),
        meta: { sortingKey: 'value' },
      },
      {
        id: 'displayOrder',
        accessorKey: 'displayOrder',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Display Order" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.displayOrder ?? '—'}</span>,
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
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
