'use client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetPriceHistorySummary } from '@/hooks/service-hooks/usePriceHistoryService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { formatPercent, formatPrice, marginPercent } from './format';

interface PriceHistorySummaryProps {
  variantId: number;
}

/** Only rendered once a single variant is selected - the figures are per-variant. */
export default function PriceHistorySummary({ variantId }: PriceHistorySummaryProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: response, isLoading } = useGetPriceHistorySummary(variantId);
  const summary = response?.data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-[86px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const margin = marginPercent(summary.currentPrice, summary.currentCostPrice);
  const movement =
    summary.firstPrice !== null && summary.currentPrice !== null && summary.firstPrice !== 0
      ? ((summary.currentPrice - summary.firstPrice) / summary.firstPrice) * 100
      : null;

  const formatDate = (value?: string | null) =>
    value ? unitOfService.DateTimeService.convertToLocalDate(value as unknown as Date, true) : '—';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card size="sm" className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">Current Price</span>
        <span className="text-xl font-semibold tabular-nums">{formatPrice(summary.currentPrice)}</span>
        <span className="text-xs text-muted-foreground">
          Cost {formatPrice(summary.currentCostPrice)}
          {margin !== null && <> · margin {formatPercent(margin)}</>}
        </span>
      </Card>

      <Card size="sm" className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">Range</span>
        <span className="text-xl font-semibold tabular-nums">
          {formatPrice(summary.minPrice)} – {formatPrice(summary.maxPrice)}
        </span>
        <span className="text-xs text-muted-foreground">Average {formatPrice(summary.averagePrice)}</span>
      </Card>

      <Card size="sm" className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">Since Launch</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tabular-nums">{formatPrice(summary.firstPrice)}</span>
          {movement !== null && (
            <Badge variant={movement > 0 ? 'green' : movement < 0 ? 'rose' : 'zinc'}>
              {movement > 0 ? '+' : ''}
              {formatPercent(movement)}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">First recorded {formatDate(summary.firstChangedAt)}</span>
      </Card>

      <Card size="sm" className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">Changes</span>
        <span className="text-xl font-semibold tabular-nums">{summary.changeCount}</span>
        <span className="text-xs text-muted-foreground">Last dated {formatDate(summary.lastChangedAt)}</span>
      </Card>
    </div>
  );
}
