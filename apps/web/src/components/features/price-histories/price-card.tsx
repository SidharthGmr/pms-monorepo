'use client';

import CardAction from '@/components/common/card-action';
import { Card } from '@/components/ui/card';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { PriceHistoryDto } from '@/dtos/price-history.dto';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CalendarClock, History, MessageSquare, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { StateBadge } from './columns';
import { formatPercent, formatPrice, marginPercent, priceState } from './format';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

interface PriceCardProps {
  row: PriceHistoryDto;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewTimeline: () => void;
}

// Card layout for the price ledger: what it sells for now, how that compares with the row it
// replaced, and when it took force.
export default function PriceCard({ row, canManage, onEdit, onDelete, onViewTimeline }: PriceCardProps) {
  const previous = row.previousPrice;
  const delta = previous !== null && previous !== undefined && previous !== 0 ? ((row.sellingPrice - previous) / previous) * 100 : null;
  const margin = marginPercent(row.sellingPrice, row.costPrice);
  const state = priceState(row);
  const up = (delta ?? 0) > 0;

  return (
    <Card className={cn('group relative !p-0 overflow-hidden transition-shadow hover:shadow-md', state === 'live' && 'ring-1 ring-emerald-500/40')}>
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <CardAction label="View price timeline" icon={History} onClick={onViewTimeline} className="hover:bg-primary hover:text-primary-foreground" />
        {canManage && (
          <>
            <CardAction label="Correct this entry (rewrites it, no new row)" icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
            <CardAction label="Delete this row" icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
          </>
        )}
      </div>

      <div className="border-b bg-muted/30 p-4 pr-24">
        <p className="truncate text-sm font-semibold" title={row.variant?.product?.name || undefined}>
          {row.variant?.product?.name || `Variant #${row.variantId}`}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {row.variant?.sku && <code className="truncate font-mono text-[11px] text-muted-foreground">{row.variant.sku}</code>}
          <StateBadge state={state} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Selling price</p>
            <p className="truncate text-2xl font-bold tabular-nums">{formatPrice(row.sellingPrice)}</p>
          </div>
          {delta !== null && delta !== 0 && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums',
                up ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
              )}
              title={`Was ${formatPrice(previous)}`}
            >
              {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {formatPercent(Math.abs(delta))}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Cost</p>
            <p className="text-sm font-semibold tabular-nums">{formatPrice(row.costPrice)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Margin</p>
            <p className={cn('text-sm font-semibold tabular-nums', margin === null ? 'text-muted-foreground' : margin < 0 ? 'text-rose-600 dark:text-rose-400' : margin < 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
              {formatPercent(margin)}
            </p>
          </div>
        </div>

        {row.reason?.trim() && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{row.reason}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate tabular-nums">
            {row.effectiveTo
              ? `${unitOfService.DateTimeService.convertToLocalDate(row.effectiveFrom as unknown as Date, true)} → ${unitOfService.DateTimeService.convertToLocalDate(row.effectiveTo as unknown as Date, true)}`
              : `From ${row.effectiveFrom ? unitOfService.DateTimeService.convertToLocalDate(row.effectiveFrom as unknown as Date, true) : '—'}`}
          </span>
        </span>
        <button type="button" onClick={onViewTimeline} className="shrink-0 font-medium text-primary hover:underline">
          Timeline
        </button>
      </div>
    </Card>
  );
}
