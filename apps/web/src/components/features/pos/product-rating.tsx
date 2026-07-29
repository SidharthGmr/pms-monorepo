'use client';
import StarRating from '@/components/common/star-rating';
import { useGetReviewSummary } from '@/hooks/service-hooks/useReviewService';

interface ProductRatingProps {
  productId: number;
}

/**
 * Average rating for one catalog card.
 *
 * `/reviews/summary/:productId` is per-product, so a page of cards issues one small
 * request each (React Query caches per productId, so paging back costs nothing). If the
 * page size grows enough for that to hurt, the fix is a batch summary endpoint rather
 * than pulling every review down and averaging client-side.
 */
export default function ProductRating({ productId }: ProductRatingProps) {
  const { data: response } = useGetReviewSummary(productId);
  const summary = response?.data?.data;

  if (!summary || !summary.totalReviews) {
    return <span className="text-[11px] text-muted-foreground">No ratings yet</span>;
  }

  return (
    <div className="flex items-center gap-1.5" title={`${summary.averageRating} out of 5 from ${summary.totalReviews} reviews`}>
      {/* Stars fill in whole steps, so the exact average sits next to them. */}
      <StarRating value={Math.round(summary.averageRating)} size="sm" />
      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
        {summary.averageRating.toFixed(1)} ({summary.totalReviews})
      </span>
    </div>
  );
}
