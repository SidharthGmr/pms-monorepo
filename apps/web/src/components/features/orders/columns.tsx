'use client';
import { OrderDto } from '@/dtos/order.dto';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';
import { toneFor } from './order-status';
import { OrderRowActions } from './row-action';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// "3 days ago" with the exact timestamp on hover; a dash when the column was never set.
function When({ value }: { value?: Date | string | null }) {
  if (!value) return <span className="text-muted-foreground/60">—</span>;
  const date = new Date(value);
  return (
    <div className="flex flex-col gap-0.5 whitespace-nowrap" title={format(date, 'PPpp')}>
      <span className="text-xs font-medium">{format(date, 'd MMM yyyy')}</span>
      <span className="text-[11px] tabular-nums text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>
    </div>
  );
}

// Table layout for the order list. Sorting is driven by the page's Sort control, not the headers.
export const useOrderColumns = (editRecord: (id: number) => void, deleteRecord: (id: number) => void, viewRecord: (id: number) => void) =>
  useMemo<ColumnDef<OrderDto>[]>(
    () => [
      {
        id: 'orderNumber',
        accessorKey: 'orderNumber',
        enableSorting: false,
        header: () => <span className={HEADER}>Order</span>,
        cell: ({ row }) => {
          const order = row.original;
          const items = order.items ?? [];
          const quantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

          return (
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
                {items.length} {items.length === 1 ? 'product' : 'products'} · {quantity} qty
              </p>
            </div>
          );
        },
        meta: { sortingKey: 'orderNumber', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'customer',
        enableSorting: false,
        header: () => <span className={HEADER}>Customer</span>,
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
        id: 'grandTotal',
        accessorKey: 'grandTotal',
        enableSorting: false,
        header: () => <span className={HEADER}>Total</span>,
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
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
              {tone.label}
            </span>
          );
        },
        meta: { sortingKey: 'status' },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        enableSorting: false,
        header: () => <span className={HEADER}>Placed</span>,
        cell: ({ row }) => (
          <div>
            <When value={row.original.createdAt} />
            {row.original.createdByName && <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">by {row.original.createdByName}</p>}
          </div>
        ),
        meta: { sortingKey: 'createdAt', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <OrderRowActions order={row.original} onView={() => viewRecord(row.original.id)} onEdit={() => editRecord(row.original.id)} onDelete={() => deleteRecord(row.original.id)} />,
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord, viewRecord]
  );
