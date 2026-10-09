'use client';
import { OrderDto } from '@/dtos/order.dto';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { Receipt } from 'lucide-react';
import { useMemo } from 'react';
import { toneFor } from './order-status';
import { OrderRowActions } from './row-action';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// Register layout for the invoice list: one row per document, read left to right the way a
// ledger is - number, who it was billed to, when it was issued, what it came to, where it stands.
export const useOrderColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void, viewRecord: (id: number) => void) =>
  useMemo<ColumnDef<OrderDto>[]>(
    () => [
      {
        id: 'orderNumber',
        accessorKey: 'orderNumber',
        enableSorting: false,
        header: () => <span className={HEADER}>Invoice</span>,
        cell: ({ row }) => {
          const order = row.original;
          const items = order.items ?? [];
          const quantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

          return (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => viewRecord(order.id)}
                  className="block max-w-[200px] truncate text-left font-mono text-sm font-semibold hover:underline"
                  title={order.orderNumber}
                >
                  {order.orderNumber}
                </button>
                <p className="text-[11px] text-muted-foreground">
                  {items.length} {items.length === 1 ? 'line' : 'lines'} · {quantity} qty
                </p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'orderNumber', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'customer',
        enableSorting: false,
        header: () => <span className={HEADER}>Billed to</span>,
        cell: ({ row }) => {
          const customer = row.original.customer;
          const name = customer?.name || [customer?.firstName, customer?.lastName].filter(Boolean).join(' ');
          const contact = customer?.email || customer?.phone;

          return (
            <div className="min-w-0">
              <p className="max-w-[200px] truncate text-sm font-medium" title={name || undefined}>
                {name || <span className="text-muted-foreground">Walk-in</span>}
              </p>
              {contact && (
                <p className="max-w-[200px] truncate text-[11px] text-muted-foreground" title={contact}>
                  {contact}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Issued</span>,
        cell: ({ row }) => {
          const value = row.original.createdAt;
          if (!value) return <span className="text-muted-foreground/60">—</span>;
          const date = new Date(value);

          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap" title={format(date, 'PPpp')}>
              <span className="text-xs font-medium tabular-nums">{format(date, 'd MMM yyyy')}</span>
              <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>
            </div>
          );
        },
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'grandTotal',
        accessorKey: 'grandTotal',
        enableSorting: false,
        header: () => <span className={HEADER}>Amount</span>,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="whitespace-nowrap">
              <p className="text-sm font-bold tabular-nums">{formatPrice(order.grandTotal ?? 0)}</p>
              {order.discount > 0 && <p className="text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">−{formatPrice(order.discount)} off</p>}
            </div>
          );
        },
        meta: { sortingKey: 'grandTotal', thClassName: 'text-right', tdClassName: 'text-right' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: false,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          const tone = toneFor(row.original.status);
          return (
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', tone.soft, tone.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
              {tone.label}
            </span>
          );
        },
        meta: { sortingKey: 'status' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <OrderRowActions order={row.original} onView={() => viewRecord(row.original.id)} onEdit={() => editRecord(row.original.id)} onDelete={() => deleteRecord(row.original.id)} />
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord, viewRecord]
  );
