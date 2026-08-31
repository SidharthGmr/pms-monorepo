'use client';
import StarRating from '@/components/common/star-rating';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useRateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VariantRatingProps {
  variantId: number;
  rating?: number | null;
  ratingCount?: number | null;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function VariantRating({ variantId, rating, ratingCount, interactive = false, size = 'sm', className }: VariantRatingProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const rateVariant = useRateProductVariant();

  const [average, setAverage] = useState<number | null>(rating ?? null);
  const [count, setCount] = useState<number>(ratingCount ?? 0);
  const [myRating, setMyRating] = useState<number | null>(null);

  // A card can be recycled onto a different variant as a list pages or refetches.
  useEffect(() => {
    setAverage(rating ?? null);
    setCount(ratingCount ?? 0);
    setMyRating(null);
  }, [variantId, rating, ratingCount]);

  const submit = async (value: number) => {
    const response = await rateVariant.mutateAsync({ id: variantId, model: { rating: value } });

    if (response && response.status === 200) {
      const summary = response.data?.data;
      // setMyRating(summary?.userRating ?? value);
      // setAverage(summary?.rating ?? null);
      // setCount(summary?.ratingCount ?? count);
      toast({ variant: 'success', title: `Rated ${summary?.userRating ?? value} out of 5` });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not save rating', description: <span>{error}</span> });
    }
  };

  // Once this user has rated, their own score is the honest thing to show them.
  const shown = myRating ?? (average != null ? Math.round(average) : 0);
  const label = average != null ? `${average.toFixed(1)} (${count})` : 'No ratings yet';

  // if (!interactive) {
  //   return average == null ? (
  //     <span className={cn('text-[11px] text-muted-foreground', className)}>No ratings yet</span>
  //   ) : (
  //     <div
  //       className={cn('flex items-center gap-1.5', className)}
  //       title={`${average.toFixed(1)} out of 5 from ${count} rating${count === 1 ? '' : 's'}`}
  //     >
  //       <StarRating value={Math.round(average)} size={size} />
  //       <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{label}</span>
  //     </div>
  //   );
  // }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StarRating value={shown} size={size} onChange={rateVariant.isPending ? undefined : submit} />
      {rateVariant.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{myRating ? `Your rating · ${label}` : label}</span>
      )}
    </div>
  );
}
