'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetPriceHistoryByVariant } from '@/hooks/service-hooks/usePriceHistoryService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Tags, TrendingDown, TrendingUp } from 'lucide-react';
import { StateBadge } from './columns';
import { formatPercent, formatPrice, marginPercent, priceState } from './format';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const HEADER = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';
const ROW_LIMIT = 50;

// The bare ledger for one variant - rows only, newest first. No toolbar, no paging, no actions:
// it rides along on read-only screens like the variant view, and the full page has the rest.
export default function VariantPriceTable({ variantId }: { variantId: number }) {
  const { data, isPending, isError } = useGetPriceHistoryByVariant(variantId, { page: 1, recordPerPage: ROW_LIMIT });

  const rows = data?.data?.data?.data ?? [];
  const total = data?.data?.data?.totalRecord ?? 0;

  const when = (value?: string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as unknown as Date, true) : '—');

  if (isPending) {
    return (
      <Card className="!p-0 overflow-hidden">
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-9 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="py-10 text-center">
        <p className="text-sm font-semibold text-destructive">Could not load the price history</p>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
        <Tags className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-sm">No prices recorded for this variant yet.</p>
      </Card>
    );
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className={cn(HEADER, 'pl-4')}>Status</TableHead>
            <TableHead className={HEADER}>Selling price</TableHead>
            <TableHead className={cn(HEADER, 'hidden md:table-cell')}>Cost</TableHead>
            <TableHead className={cn(HEADER, 'hidden md:table-cell text-center')}>Margin</TableHead>
            <TableHead className={HEADER}>In force</TableHead>
            <TableHead className={cn(HEADER, 'hidden lg:table-cell pr-4')}>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const previous = row.previousPrice;
            const delta = previous !== null && previous !== undefined && previous !== 0 ? ((row.sellingPrice - previous) / previous) * 100 : null;
            const up = (delta ?? 0) > 0;
            const margin = marginPercent(row.sellingPrice, row.costPrice);

            return (
              <TableRow key={row.id}>
                <TableCell className="pl-4">
                  <StateBadge state={priceState(row)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-sm font-semibold tabular-nums">{formatPrice(row.sellingPrice)}</span>
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
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm tabular-nums text-muted-foreground">{formatPrice(row.costPrice)}</span>
                </TableCell>
                <TableCell className="hidden text-center md:table-cell">
                  {margin === null ? (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        margin < 0 ? 'text-rose-600 dark:text-rose-400' : margin < 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {formatPercent(margin)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                    {row.effectiveTo ? `${when(row.effectiveFrom)} → ${when(row.effectiveTo)}` : `From ${when(row.effectiveFrom)}`}
                  </span>
                </TableCell>
                <TableCell className="hidden pr-4 lg:table-cell">
                  {row.reason?.trim() ? (
                    <span className="line-clamp-1 max-w-[260px] text-xs text-muted-foreground" title={row.reason}>
                      {row.reason}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {total > ROW_LIMIT && <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">Showing the newest {ROW_LIMIT} of {total} entries.</p>}
    </Card>
  );
}
