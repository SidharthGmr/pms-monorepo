'use client';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PurchaseDto } from '@/dtos/purchase.dto';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { formatPurchaseAmount, purchaseStatusVariant } from './format';
import PurchaseListRowActions from './row-action';

const initials = (name?: string) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '—';

export const usePurchaseColumns = () =>
  useMemo<ColumnDef<PurchaseDto>[]>(
    () => [
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <PurchaseListRowActions row={row} />,
        meta: { thClassName: 'text-right', tdClassName: 'text-right' },
      },
      {
        id: 'invoiceNumber',
        accessorKey: 'invoiceNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Invoice #" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              href={`/admin/stock-purchase/history/${row.original.id}`}
              className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {row.original.invoiceNumber || 'N/A'}
            </Link>
            {/* <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span> */}
          </div>
        ),
        meta: { sortingKey: 'invoiceNumber' },
      },
      {
        id: 'supplierName',
        accessorKey: 'supplierName',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Supplier" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className={row.original.supplierName ? 'font-medium' : 'text-muted-foreground'}>{row.original.supplierName || 'N/A'}</span>
            {/* {row.original.supplierId && <span className="text-xs text-muted-foreground">ID: {row.original.supplierId}</span>} */}
          </div>
        ),
        meta: { sortingKey: 'supplierName' },
      },
      {
        id: 'purchaseDate',
        accessorKey: 'purchaseDate',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Date" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          const date = row.original.purchaseDate || row.original.createdAt;
          if (!date) return <span className="text-muted-foreground">—</span>;
          return <span className="whitespace-nowrap text-sm">{unitOfService.DateTimeService.convertToLocalDate(date as unknown as Date, true)}</span>;
        },
        meta: { sortingKey: 'purchaseDate' },
      },
      {
        id: 'items',
        accessorKey: 'items',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Items" />,
        cell: ({ row }) => {
          const items = row.original.items ?? [];
          const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
          return (
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-semibold">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                {items.length}
              </span>
              <span className="text-xs text-muted-foreground">{totalQuantity} qty</span>
            </div>
          );
        },
        meta: { sortingKey: 'items', thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'totalAmount',
        accessorKey: 'totalAmount',
        header: ({ column }) => <DataTableColumnHeader column={column} className="justify-end text-xs font-semibold uppercase" title="Total Cost" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono font-semibold text-primary">{formatPurchaseAmount(row.original.totalAmount)}</span>
        ),
        meta: { sortingKey: 'totalAmount', thClassName: 'text-right', tdClassName: 'text-right' },
      },
      {
        id: 'user',
        accessorKey: 'user',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-semibold uppercase" title="Created By" />,
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-muted-foreground">System</span>;
          return (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {initials(user.name)}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'user' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => <Badge variant={purchaseStatusVariant(row.original.status)}>{row.original.status || '—'}</Badge>,
        meta: { sortingKey: 'status', thClassName: 'text-center', tdClassName: 'text-center' },
      },
    ],
    []
  );
