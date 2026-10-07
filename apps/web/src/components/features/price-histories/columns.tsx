'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PriceHistoryDto } from '@/dtos/price-history.dto';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ColumnDef } from '@tanstack/react-table';
import { History, Package, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { formatPercent, formatPrice, marginPercent, priceState, PriceState } from './format';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

interface PriceHistoryColumnOptions {
  editRecord: (id: number) => void;
  deleteRecord: (id: number) => void;
  /** Opens the variant's full price timeline; available whatever the role. */
  viewTimeline: (row: PriceHistoryDto) => void;
  /**
   * Correcting and deleting a row are admin-only on the API. Staff would get a 403,
   * which HttpService turns into an /access-denied redirect - so hide the buttons.
   */
  canManage: boolean;
}

// One word for where the row sits against now, coloured the same way in table, card and timeline.
export function StateBadge({ state }: { state: PriceState }) {
  if (state === 'live') return <Badge variant="green" className="w-fit">Live now</Badge>;
  if (state === 'scheduled') return <Badge variant="blue" className="w-fit">Scheduled</Badge>;
  return <Badge variant="zinc" className="w-fit">Ended</Badge>;
}

export const usePriceHistoryColumns = ({ editRecord, deleteRecord, viewTimeline, canManage }: PriceHistoryColumnOptions) =>
  useMemo<ColumnDef<PriceHistoryDto>[]>(
    () => [
      {
        id: 'variant',
        accessorKey: 'variantId',
        enableSorting: false,
        header: () => <span className={HEADER}>Product / Variant</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Package className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="max-w-[240px] truncate text-sm font-semibold" title={row.original.variant?.product?.name || undefined}>
                {row.original.variant?.product?.name || `Variant #${row.original.variantId}`}
              </p>
              <code className="block truncate font-mono text-[11px] text-muted-foreground">{row.original.variant?.sku || '—'}</code>
            </div>
          </div>
        ),
        meta: { thClassName: 'pl-4', tdClassName: 'pl-4' },
      },
      {
        id: 'sellingPrice',
        accessorKey: 'sellingPrice',
        enableSorting: false,
        header: () => <span className={HEADER}>Selling price</span>,
        cell: ({ row }) => {
          // The API resolves what this row replaced, so the comparison holds however the
          // table is sorted and even when the previous row sits on another page.
          const previous = row.original.previousPrice;
          const delta = previous !== null && previous !== undefined && previous !== 0 ? ((row.original.sellingPrice - previous) / previous) * 100 : null;
          const up = (delta ?? 0) > 0;

          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-sm font-semibold tabular-nums">{formatPrice(row.original.sellingPrice)}</span>
              {delta !== null && delta !== 0 && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                    up ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                  )}
                  title={`Was ${formatPrice(previous)}`}
                >
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPercent(Math.abs(delta))}
                </span>
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
        header: () => <span className={HEADER}>Cost</span>,
        cell: ({ row }) => <span className="text-sm tabular-nums text-muted-foreground">{formatPrice(row.original.costPrice)}</span>,
        meta: { sortingKey: 'costPrice', thClassName: 'hidden md:table-cell', tdClassName: 'hidden md:table-cell' },
      },
      {
        id: 'margin',
        enableSorting: false,
        header: () => <span className={HEADER}>Margin</span>,
        cell: ({ row }) => {
          const margin = marginPercent(row.original.sellingPrice, row.original.costPrice);
          if (margin === null) return <span className="text-xs text-muted-foreground/60">—</span>;

          return (
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                margin < 0 ? 'text-rose-600 dark:text-rose-400' : margin < 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {formatPercent(margin)}
            </span>
          );
        },
        meta: { thClassName: 'text-center', tdClassName: 'text-center' },
      },
      {
        id: 'effectiveFrom',
        accessorKey: 'effectiveFrom',
        enableSorting: false,
        header: () => <span className={HEADER}>In force</span>,
        cell: ({ row }) => {
          const state = priceState(row.original);
          const when = (value?: string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as unknown as Date, true) : '—');

          return (
            <div className="flex flex-col gap-1">
              <StateBadge state={state} />
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                {row.original.effectiveTo ? `${when(row.original.effectiveFrom)} → ${when(row.original.effectiveTo)}` : `From ${when(row.original.effectiveFrom)}`}
              </span>
            </div>
          );
        },
        meta: { sortingKey: 'effectiveFrom' },
      },
      {
        id: 'reason',
        accessorKey: 'reason',
        enableSorting: false,
        header: () => <span className={HEADER}>Reason</span>,
        cell: ({ row }) =>
          row.original.reason?.trim() ? (
            <span className="line-clamp-2 max-w-[260px] text-xs text-muted-foreground" title={row.original.reason}>
              {row.original.reason}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          ),
        meta: { thClassName: 'hidden lg:table-cell', tdClassName: 'hidden lg:table-cell' },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => viewTimeline(row.original)}
              aria-label="View price timeline"
              title="Timeline"
            >
              <History className="h-4 w-4" />
            </Button>
            {canManage && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => editRecord(+row.original.id)}
                  aria-label="Correct this entry"
                  title="Correct this entry (rewrites it, no new row)"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteRecord(+row.original.id)}
                  aria-label="Delete this row"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ),
        meta: { thClassName: 'w-32 pr-4', tdClassName: 'pr-4' },
      },
    ],
    [editRecord, deleteRecord, viewTimeline, canManage]
  );
