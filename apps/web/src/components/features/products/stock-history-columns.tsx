'use client';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';

export const useStockHistoryColumns = () =>
  useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Date" />,
        cell: ({ row }) => <div>{row.getValue('createdAt') ? format(new Date(row.getValue('createdAt') as string), 'PPpp') : '-'}</div>,
        meta: { sortingKey: 'createdAt' },
      },
      {
        id: 'quantity',
        accessorKey: 'quantity',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Quantity" />,
        cell: ({ row }) => {
          const qty = row.getValue('quantity') as number;
          return (
            <div className={`font-semibold ${qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {qty > 0 ? `+${qty}` : qty}
            </div>
          );
        },
        meta: { sortingKey: 'quantity' },
      },
      {
        id: 'reason',
        accessorKey: 'reason',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Reason" />,
        cell: ({ row }) => <div>{row.getValue('reason') || '-'}</div>,
        meta: { sortingKey: 'reason' },
      },
      {
        id: 'user',
        accessorKey: 'user',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Added By" />,
        cell: ({ row }) => {
          const user = row.original.user;
          return <div>{user ? user.name : '-'}</div>;
        },
        meta: { sortingKey: 'user' },
      },
    ],
    []
  );
