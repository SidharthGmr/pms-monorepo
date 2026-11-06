'use client';

import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format-price';
import { EstimateDto, EstimateStatusEnum } from '@pms/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, FileText, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import EstimateStatusBadge, { displayStatusOf } from './status-badge';

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

export const useEstimateColumns = (
  editRecord: (id: number) => void,
  deleteRecord: (id: number) => void,
  viewRecord: (estimateNumber: string) => void
) =>
  useMemo<ColumnDef<EstimateDto>[]>(
    () => [
      {
        id: 'estimateNumber',
        accessorKey: 'estimateNumber',
        enableSorting: false,
        header: () => <span className={HEADER}>Estimate</span>,
        cell: ({ row }) => {
          const estimate = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <Link
                  title={estimate.estimateNumber}
                  href={`/admin/estimates/${estimate.estimateNumber}`}
                  className="block max-w-[220px] truncate text-sm font-semibold hover:underline"
                >
                  {estimate.estimateNumber}
                </Link>
                {estimate.referenceNumber && <p className="max-w-[220px] truncate text-[11px] text-muted-foreground">Ref: {estimate.referenceNumber}</p>}
              </div>
            </div>
          );
        },
        meta: { sortingKey: 'estimateNumber', thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'customerName',
        accessorKey: 'customerName',
        enableSorting: false,
        header: () => <span className={HEADER}>Customer</span>,
        cell: ({ row }) => {
          const estimate = row.original;
          const contact = estimate.customerEmail || estimate.customerPhone;
          return (
            <div className="min-w-0">
              <p className="max-w-[200px] truncate text-sm font-medium" title={estimate.customerName}>
                {estimate.customerName}
              </p>
              {contact && (
                <p className="max-w-[200px] truncate text-[11px] text-muted-foreground" title={contact}>
                  {contact}
                </p>
              )}
            </div>
          );
        },
        meta: { sortingKey: 'customerName' },
      },
      {
        id: 'estimateDate',
        accessorKey: 'estimateDate',
        enableSorting: false,
        header: () => <span className={HEADER}>Date / Valid until</span>,
        cell: ({ row }) => {
          const estimate = row.original;
          const issued = new Date(estimate.estimateDate);
          const until = estimate.validUntil ? new Date(estimate.validUntil) : null;
          const expired = until ? until.getTime() < Date.now() : false;
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap">
              <span className="text-xs font-medium tabular-nums">{format(issued, 'd MMM yyyy')}</span>
              <span className={`text-[11px] tabular-nums ${expired ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                {until ? `until ${format(until, 'd MMM yyyy')}` : 'no expiry'}
              </span>
            </div>
          );
        },
        meta: { sortingKey: 'estimateDate', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'grandTotal',
        accessorKey: 'grandTotal',
        enableSorting: false,
        header: () => <span className={HEADER}>Amount</span>,
        cell: ({ row }) => {
          const estimate = row.original;
          const discount = (estimate.itemDiscountTotal ?? 0) + (estimate.additionalDiscount ?? 0);
          return (
            <div className="whitespace-nowrap">
              <p className="text-sm font-bold tabular-nums">{formatPrice(estimate.grandTotal ?? 0)}</p>
              {discount > 0 && <p className="text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">−{formatPrice(discount)} off</p>}
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
        cell: ({ row }) => <EstimateStatusBadge status={displayStatusOf(row.original)} />,
        meta: { sortingKey: 'status' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const estimate = row.original;
          const editable = estimate.status === EstimateStatusEnum.Draft;
          const deletable = estimate.status === EstimateStatusEnum.Draft || estimate.status === EstimateStatusEnum.Cancelled;
          return (
            <div className="flex items-center justify-end gap-0.5">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => viewRecord(estimate.estimateNumber)}>
                <Eye className="h-4 w-4" />
              </Button>
              {editable && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Edit draft" onClick={() => editRecord(estimate.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {deletable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                  title="Delete"
                  onClick={() => deleteRecord(estimate.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
        meta: { thClassName: 'w-28 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord, viewRecord]
  );
