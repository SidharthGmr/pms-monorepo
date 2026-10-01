'use client';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ImageOff } from 'lucide-react';
import { BrandNameDto } from '@pms/types';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

const HEADER = 'text-xs font-semibold uppercase';

const formatDate = (value?: Date | string | null) => {
  if (!value) return '—';
  return container.get<IUnitOfService>(TYPES.IUnitOfService).DateTimeService.convertToLocalDate(new Date(value), true);
};

// Table layout for the brand list. Sorting is driven by the page's Sort control, not the headers.
export const useBrandNameColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<BrandNameDto>[]>(
    () => [
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ActionTooltip variant="edit" tooltip="Edit brand" onClick={() => editRecord(row.original.id)} />
            <ActionTooltip variant="delete" tooltip="Delete brand" onClick={() => deleteRecord(row.original.id)} />
          </div>
        ),
      },
      {
        id: 'logo',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className={HEADER} title="Logo" />,
        cell: ({ row }) => (
          <span className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
            {row.original.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.original.images[0]} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              <ImageOff className="h-4 w-4 text-muted-foreground/40" />
            )}
          </span>
        ),
      },
      {
        id: 'name',
        accessorKey: 'name',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className={HEADER} title="Brand Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        meta: { sortingKey: 'name' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className={HEADER} title="Status" />,
        cell: ({ row }) => (
          <Badge variant={row.original.status === StatusValues.Published ? 'green' : row.original.status === StatusValues.Trash ? 'destructive' : 'orange'}>
            {row.original.status}
          </Badge>
        ),
        meta: { sortingKey: 'status', thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'displayOrder',
        accessorKey: 'displayOrder',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className={HEADER} title="Display Order" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.displayOrder ?? '—'}</span>,
        meta: { sortingKey: 'displayOrder', thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className={HEADER} title="Created At" />,
        cell: ({ row }) => <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
        meta: { sortingKey: 'createdAt' },
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className={HEADER} title="Updated At" />,
        cell: ({ row }) => <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
        meta: { sortingKey: 'updatedAt' },
      },
    ],
    [editRecord, deleteRecord]
  );
