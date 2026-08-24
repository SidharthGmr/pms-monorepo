'use client';
import ActionTooltip from '@/components/common/tooltip-action-button';
import { Badge } from '@/components/ui/badge';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PriceHistoryDto } from '@/dtos/price-history.dto';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '../../Table/data-table-column-header';
import { formatPercent, formatPrice, isScheduled, marginPercent } from './format';

interface PriceHistoryColumnOptions {
  editRecord: (id: number) => void;
  deleteRecord: (id: number) => void;
  /**
   * Id of the row that is actually effective right now, resolved from the API rather
   * than guessed from the page - only known when a single variant is selected.
   */
  effectiveRowId?: number;
  /**
   * Correcting and deleting a row are admin-only on the API. Staff would get a 403,
   * which HttpService turns into an /access-denied redirect - so hide the buttons.
   */
  canManage: boolean;
}

export const usePriceHistoryColumns = ({ editRecord, deleteRecord, effectiveRowId, canManage }: PriceHistoryColumnOptions) =>
  useMemo<ColumnDef<PriceHistoryDto>[]>(
    () => [
      ...(canManage
        ? [
            {
              id: 'actions',
              header: 'Action',
              enableSorting: false,
              cell: ({ row }) => (
                <div className="flex items-center gap-2">
                  <ActionTooltip variant="edit" tooltip="Correct Record" onClick={() => editRecord(+row.original.id)} />
                  <ActionTooltip variant="delete" tooltip="Delete Record" onClick={() => deleteRecord(+row.original.id)} />
                </div>
              ),
            } satisfies ColumnDef<PriceHistoryDto>,
          ]
        : []),
      {
        id: 'variant',
        accessorKey: 'variantId',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Product / Variant" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.variant?.product?.name || `Variant #${row.original.variantId}`}</span>
            {row.original.variant?.sku && <code className="font-mono text-xs text-muted-foreground">{row.original.variant.sku}</code>}
          </div>
        ),
      },
      {
        id: 'sellingPrice',
        accessorKey: 'sellingPrice',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Selling Price" />,
        cell: ({ row }) => {
          // The API resolves what this row replaced, so the comparison holds however the
          // table is sorted and even when the previous row sits on another page.
          const previous = row.original.previousPrice;
          const delta = previous !== null && previous !== undefined && previous !== 0 ? ((row.original.sellingPrice - previous) / previous) * 100 : null;

          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">{formatPrice(row.original.sellingPrice)}</span>
              {delta !== null && delta !== 0 && (
                <Badge variant={delta > 0 ? 'green' : 'rose'} className="tabular-nums" title={`Was ${formatPrice(previous)}`}>
                  {delta > 0 ? '▲' : '▼'} {formatPercent(Math.abs(delta))}
                </Badge>
              )}
            </div>
          );
        },
        meta: { sortingKey: 'sellingPrice' },
      },
      {
        id: 'costPrice',
        accessorKey: 'costPrice',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Cost Price" />,
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatPrice(row.original.costPrice)}</span>,
        meta: { sortingKey: 'costPrice' },
      },
      {
        id: 'margin',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Margin" />,
        cell: ({ row }) => {
          const margin = marginPercent(row.original.sellingPrice, row.original.costPrice);
          if (margin === null) return <span className="text-muted-foreground">—</span>;
          return (
            <Badge variant={margin < 0 ? 'rose' : margin < 15 ? 'orange' : 'green'} className="tabular-nums">
              {formatPercent(margin)}
            </Badge>
          );
        },
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'effectiveFrom',
        accessorKey: 'effectiveFrom',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Effective From" />,
        cell: ({ row }) => {
          const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
          const scheduled = isScheduled(row.original.effectiveFrom);

          return (
            <div className="flex flex-col gap-1">
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                {row.original.effectiveFrom
                  ? unitOfService.DateTimeService.convertToLocalDate(row.original.effectiveFrom as unknown as Date, true)
                  : '—'}
              </span>
              {scheduled ? (
                <Badge variant="blue" className="w-fit">
                  Scheduled
                </Badge>
              ) : (
                effectiveRowId === row.original.id && (
                  <Badge variant="green" className="w-fit">
                    Active
                  </Badge>
                )
              )}
            </div>
          );
        },
        meta: { sortingKey: 'effectiveFrom' },
      },
      {
        id: 'reason',
        accessorKey: 'reason',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} className="text-xs font-semibold uppercase" title="Reason" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.reason?.trim() ? row.original.reason : '—'}</span>
        ),
      },
    ],
    [editRecord, deleteRecord, effectiveRowId, canManage]
  );
