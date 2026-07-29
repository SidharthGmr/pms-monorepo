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
        id: 'variant',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Variant" />,
        cell: ({ row }) => {
          const variant = row.original.variant;
          if (!variant) {
            // Order and purchase movements are still booked at product level, as are rows
            // written before stock became variant-level.
            return <span className="text-xs text-muted-foreground">Product level</span>;
          }

          const attributes = variant.attributes;
          const description =
            attributes && typeof attributes === 'object'
              ? Object.values(attributes)
                  .filter((value: unknown) => value !== null && value !== undefined && value !== '')
                  .map(String)
                  .join(' / ')
              : '';

          return (
            <div className="flex flex-col">
              {description && <span className="font-medium">{description}</span>}
              {variant.sku && <code className="font-mono text-xs text-muted-foreground">{variant.sku}</code>}
            </div>
          );
        },
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
