'use client';

import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowLeftRight, Undo2 } from 'lucide-react';
import { useMemo } from 'react';
import { OrderReturnDto, ReturnTypeEnum } from '@pms/types';
import { returnToneFor, RETURN_TYPE_LABEL } from './return-status';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

export const useOrderReturnColumns = (viewRecord: (id: number) => void) =>
  useMemo<ColumnDef<OrderReturnDto>[]>(
    () => [
      {
        id: 'returnNumber',
        accessorKey: 'returnNumber',
        enableSorting: false,
        header: () => <span className={HEADER}>Return</span>,
        cell: ({ row }) => {
          const orderReturn = row.original;
          const isExchange = orderReturn.type === ReturnTypeEnum.Exchange;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {isExchange ? <ArrowLeftRight className="h-4 w-4" /> : <Undo2 className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => viewRecord(orderReturn.id)}
                  className="block max-w-[190px] truncate text-left font-mono text-sm font-semibold hover:underline"
                  title={orderReturn.returnNumber}
                >
                  {orderReturn.returnNumber}
                </button>
                <p className="text-[11px] text-muted-foreground">
                  {RETURN_TYPE_LABEL[orderReturn.type] ?? orderReturn.type} · {(orderReturn.items ?? []).length}{' '}
                  {(orderReturn.items ?? []).length === 1 ? 'line' : 'lines'}
                </p>
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'returnNumber', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'order',
        enableSorting: false,
        header: () => <span className={HEADER}>Invoice</span>,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-sm">{row.original.order?.orderNumber ?? `#${row.original.orderId}`}</p>
            <p className="max-w-[160px] truncate text-[11px] text-muted-foreground">{row.original.customer?.name ?? ''}</p>
          </div>
        ),
      },
      {
        id: 'refundAmount',
        accessorKey: 'refundAmount',
        enableSorting: true,
        header: () => <span className={HEADER}>Refund</span>,
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold tabular-nums">{formatPrice(row.original.refundAmount)}</p>
            {row.original.refundMethod && <p className="text-[11px] text-muted-foreground">{row.original.refundMethod}</p>}
          </div>
        ),
        meta: { sortingKey: 'refundAmount' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: true,
        header: () => <span className={HEADER}>Status</span>,
        cell: ({ row }) => {
          const tone = returnToneFor(row.original.status);
          return (
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', tone.soft, tone.text)}>
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
        enableSorting: true,
        header: () => <span className={HEADER}>Requested</span>,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{format(new Date(row.original.createdAt), 'dd MMM yyyy, hh:mm a')}</span>,
        meta: { sortingKey: 'createdAt' },
      },
    ],
    [viewRecord]
  );
