'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PriceHistoryDto } from '@/dtos/price-history.dto';
import { useGetPriceHistoryByVariant, useGetPriceHistorySummary } from '@/hooks/service-hooks/usePriceHistoryService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { formatDistanceToNow } from 'date-fns';
import { Flag, Minus, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { StateBadge } from './columns';
import { formatPercent, formatPrice, marginPercent, priceState } from './format';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

// One page is enough for a ledger this size; a variant with more than 100 changes shows the newest 100.
const TIMELINE_LIMIT = 100;

interface PriceTimelineProps {
  isOpen: boolean;
  variantId: number;
  title: string;
  sku?: string | null;
  onClose: () => void;
  /** Opens the record dialog pre-set to this variant; omitted for roles that may not add rows. */
  onRecordNew?: () => void;
}

// Every price this variant has carried, newest first, with the step between each row.
export default function PriceTimeline({ isOpen, variantId, title, sku, onClose, onRecordNew }: PriceTimelineProps) {
  const { data: listResponse, isPending, isError } = useGetPriceHistoryByVariant(variantId, { page: 1, recordPerPage: TIMELINE_LIMIT }, isOpen);
  const { data: summaryResponse } = useGetPriceHistorySummary(variantId, isOpen);

  const rows: PriceHistoryDto[] = listResponse?.data?.data?.data ?? [];
  const total = listResponse?.data?.data?.totalRecord ?? 0;
  const summary = summaryResponse?.data?.data;

  const when = (value?: string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as unknown as Date, true) : '—');

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{title}</DialogTitle>
          <DialogDescription>
            {sku ? <code className="font-mono">{sku}</code> : `Variant #${variantId}`}
            {total > 0 && ` · ${total} ${total === 1 ? 'price' : 'prices'} recorded`}
          </DialogDescription>
        </DialogHeader>

        {summary && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Now</p>
              <p className="truncate text-sm font-semibold tabular-nums">{formatPrice(summary.currentPrice)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Range</p>
              <p className="truncate text-sm font-semibold tabular-nums" title={`${formatPrice(summary.minPrice)} – ${formatPrice(summary.maxPrice)}`}>
                {formatPrice(summary.minPrice)} – {formatPrice(summary.maxPrice)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Changes</p>
              <p className="truncate text-sm font-semibold tabular-nums">{summary.changeCount}</p>
            </div>
          </div>
        )}

        <div className="-mr-2 max-h-[52vh] overflow-y-auto pr-2">
          {isPending ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="flex gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-destructive">Could not load this timeline.</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No prices recorded for this variant yet.</p>
          ) : (
            <ol className="relative space-y-4 py-2">
              {rows.map((row, index) => {
                const previous = row.previousPrice;
                const delta = previous !== null && previous !== undefined && previous !== 0 ? ((row.sellingPrice - previous) / previous) * 100 : null;
                const up = (delta ?? 0) > 0;
                const state = priceState(row);
                const margin = marginPercent(row.sellingPrice, row.costPrice);
                const first = previous === null || previous === undefined;

                return (
                  <li key={row.id} className="relative flex gap-3">
                    {index < rows.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-0.5rem)] w-px bg-border" aria-hidden />}

                    <span
                      className={cn(
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
                        first
                          ? 'bg-primary/15 text-primary'
                          : up
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : delta === null || delta === 0
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {first ? <Flag className="h-4 w-4" /> : up ? <TrendingUp className="h-4 w-4" /> : delta === null || delta === 0 ? <Minus className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </span>

                    <div className="min-w-0 flex-1 rounded-xl border bg-card p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground" title={row.effectiveTo ? `${when(row.effectiveFrom)} → ${when(row.effectiveTo)}` : when(row.effectiveFrom)}>
                          {row.effectiveTo ? `${when(row.effectiveFrom)} → ${when(row.effectiveTo)}` : `From ${when(row.effectiveFrom)}`}
                          {row.effectiveFrom && <span className="ml-1 text-muted-foreground/70">({formatDistanceToNow(new Date(row.effectiveFrom), { addSuffix: true })})</span>}
                        </span>
                        <StateBadge state={state} />
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                        {!first && <span className="text-sm tabular-nums text-muted-foreground line-through">{formatPrice(previous)}</span>}
                        <span className="text-lg font-bold tabular-nums">{formatPrice(row.sellingPrice)}</span>
                        {delta !== null && delta !== 0 && (
                          <span className={cn('text-xs font-semibold tabular-nums', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                            {up ? '+' : '−'}
                            {formatPercent(Math.abs(delta))}
                          </span>
                        )}
                        {first && <span className="text-xs text-muted-foreground">first price</span>}
                      </div>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Cost {formatPrice(row.costPrice)}
                        {margin !== null && ` · margin ${formatPercent(margin)}`}
                      </p>

                      {row.reason?.trim() && <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">{row.reason}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {total > TIMELINE_LIMIT && <p className="text-center text-[11px] text-muted-foreground">Showing the newest {TIMELINE_LIMIT} of {total} entries.</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {onRecordNew && (
            <Button type="button" className="gap-1.5" onClick={onRecordNew}>
              <Plus className="h-4 w-4" />
              Record new price
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
