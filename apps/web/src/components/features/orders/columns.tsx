'use client';

import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { OrderDto } from '@/dtos/order.dto';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { Badge } from '../../ui/badge';
import { OrderRowActions } from './row-action';
import { Calendar, User, Clock, ShoppingBag, DollarSign } from 'lucide-react';

export const useOrderColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void) =>
  useMemo<ColumnDef<OrderDto>[]>(
    () => [
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <OrderRowActions row={row} editRecord={editRecord} deleteRecord={deleteRecord} />,
      },
      {
        id: 'orderNumber',
        accessorKey: 'orderNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-left text-xs font-bold uppercase tracking-wider" title="Order ID" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
            {row.original.orderNumber}
          </span>
        ),
      },
      {
        id: 'customerId',
        accessorKey: 'customerId',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Customer" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-muted">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground max-w-[120px] truncate block" title={row.original.customerId}>
              {row.original.customerId}
            </span>
          </div>
        ),
      },
      {
        id: 'createdByName',
        accessorKey: 'createdByName',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Created By" />,
        cell: ({ row }) => {
          const createdByName = row.original.createdByName;
          if (!createdByName) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <User className="h-3 w-3" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{createdByName}</span>
                {row.original.createdById && (
                  <span className="text-[10px] text-muted-foreground">ID: {row.original.createdById}</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Date Placed" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          const convertedDate = row.original.createdAt ? unitOfService.DateTimeService.convertToLocalDate(row.original.createdAt, true) : '—';
          
          if (convertedDate === '—') return <span className="text-muted-foreground">—</span>;
          
          // Split into Date and Time for cleaner dual-line layout
          const parts = convertedDate.split(' ');
          const datePart = parts[0] || '';
          const timePart = parts.slice(1).join(' ') || '';

          return (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/75" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-foreground leading-tight">{datePart}</span>
                {timePart && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {timePart}
                  </span>
                )}
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'createdAt' },
      },
      {
        id: 'items',
        header: 'Order Items',
        cell: ({ row }) => {
          const items = row.original.items || [];
          return (
            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
              {items.map((item) => (
                <Badge 
                  key={item.id} 
                  variant="outline" 
                  className="text-[10px] font-medium py-0.5 px-2 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-md flex items-center gap-1"
                >
                  <ShoppingBag className="h-2.5 w-2.5" />
                  ID {item.productId} <span className="text-muted-foreground font-normal">({item.quantity}x)</span>
                </Badge>
              ))}
              {items.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
            </div>
          );
        },
      },
      {
        id: 'grandTotal',
        accessorKey: 'grandTotal',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Total" />,
        cell: ({ row }) => (
          <div className="flex items-center text-sm font-semibold text-foreground">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground/60 mr-0.5" />
            <span>{row.original.grandTotal.toFixed(2)}</span>
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status || 'PENDING';
          
          // Match color mapping according to the OrderStatus state
          const colorsMap: Record<string, string> = {
            PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/10',
            CONFIRMED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/10',
            SHIPPED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10',
            DELIVERED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10',
            CANCELLED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10',
            RETURNED: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/10',
          };

          const appliedColor = colorsMap[status.toUpperCase()] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';

          return (
            <Badge 
              variant="outline" 
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${appliedColor}`}
            >
              {status}
            </Badge>
          );
        },
      },
    ],
    [deleteRecord, editRecord]
  );
