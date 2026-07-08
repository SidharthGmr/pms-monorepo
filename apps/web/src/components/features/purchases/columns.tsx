'use client';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import PurchaseListRowActions from './row-action';

export const usePurchaseColumns = () =>
  useMemo<ColumnDef<PurchaseDto>[]>(
    () => [
      {
        id: 'invoiceNumber',
        accessorKey: 'invoiceNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Invoice #" />,
        cell: ({ row }) => <div className="font-medium px-4">{row.getValue('invoiceNumber') || 'N/A'}</div>,
        meta: { sortingKey: 'invoiceNumber' },
      },
      {
        id: 'supplierName',
        accessorKey: 'supplierName',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Supplier" />,
        cell: ({ row }) => <div className="px-4">{row.getValue('supplierName') || 'N/A'}</div>,
        meta: { sortingKey: 'supplierName' },
      },
      {
        id: 'totalAmount',
        accessorKey: 'totalAmount',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Total Cost" />,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue('totalAmount'));
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount);
          return <div className="font-semibold text-primary">{formatted}</div>;
        },
        meta: { sortingKey: 'totalAmount' },
      },
      {
        id: 'purchaseDate',
        accessorKey: 'purchaseDate',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Date" />,
        cell: ({ row }) => {
          const date = row.getValue('purchaseDate') as string;
          if (!date) return <div>N/A</div>;
          return <div>{format(new Date(date), 'dd MMM yyyy')}</div>;
        },
        meta: { sortingKey: 'purchaseDate' },
      },
      {
        id: 'user',
        accessorKey: 'user',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Created By" />,
        cell: ({ row }) => {
          const user = row.original.user;
          return <div>{user ? user.name : 'System'}</div>;
        },
        meta: { sortingKey: 'user' },
      },
      {
        id: 'actions',
        cell: ({ row }) => <PurchaseListRowActions row={row} />,
      },
    ],
    []
  );
