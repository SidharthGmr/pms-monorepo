'use client';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PurchaseDto } from '@/dtos/purchase.dto';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { formatPurchaseAmount, purchaseStatusVariant } from './format';
import PurchaseListRowActions from './row-action';

export const usePurchaseColumns = () =>
  useMemo<ColumnDef<PurchaseDto>[]>(
    () => [
      {
        id: 'invoiceNumber',
        accessorKey: 'invoiceNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Invoice #" />,
        cell: ({ row }) => (
          <div className="px-4">
            <div className="font-medium">{row.original.invoiceNumber || 'N/A'}</div>
            <div className="text-xs text-muted-foreground">#{row.original.id}</div>
          </div>
        ),
        meta: { sortingKey: 'invoiceNumber' },
      },
      {
        id: 'supplierName',
        accessorKey: 'supplierName',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Supplier" />,
        cell: ({ row }) => (
          <div className="px-4">
            <div>{row.original.supplierName || 'N/A'}</div>
            {row.original.supplierId && <div className="text-xs text-muted-foreground">ID: {row.original.supplierId}</div>}
          </div>
        ),
        meta: { sortingKey: 'supplierName' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <Badge variant={purchaseStatusVariant(row.original.status)}>{row.original.status || '—'}</Badge>,
        meta: { sortingKey: 'status' },
      },
      {
        id: 'items',
        accessorKey: 'items',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Items" />,
        cell: ({ row }) => {
          const items = row.original.items ?? [];
          const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
          return (
            <div className="text-sm">
              <div>{items.length === 1 ? '1 item' : `${items.length} items`}</div>
              <div className="text-xs text-muted-foreground">{totalQuantity} qty</div>
            </div>
          );
        },
        meta: { sortingKey: 'items' },
      },
      {
        id: 'totalAmount',
        accessorKey: 'totalAmount',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Total Cost" />,
        cell: ({ row }) => <div className="font-semibold text-primary">{formatPurchaseAmount(row.original.totalAmount)}</div>,
        meta: { sortingKey: 'totalAmount' },
      },
      {
        id: 'purchaseDate',
        accessorKey: 'purchaseDate',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Date" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          const date = row.original.purchaseDate;
          if (!date) return <div>N/A</div>;
          return <div className="text-sm">{unitOfService.DateTimeService.convertToLocalDate(date as unknown as Date, true)}</div>;
        },
        meta: { sortingKey: 'purchaseDate' },
      },
      {
        id: 'user',
        accessorKey: 'user',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Created By" />,
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <div>System</div>;
          return (
            <div className="flex flex-col">
              <span className="text-sm">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          );
        },
        meta: { sortingKey: 'user' },
      },
      {
        id: 'notes',
        accessorKey: 'notes',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Notes" />,
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={row.original.notes ?? undefined}>
            {row.original.notes || '—'}
          </div>
        ),
        meta: { sortingKey: 'notes' },
      },
      {
        id: 'actions',
        cell: ({ row }) => <PurchaseListRowActions row={row} />,
      },
    ],
    []
  );
