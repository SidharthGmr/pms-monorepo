'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetPublicProductReviews, useGetPublicReviewSummary } from '@/hooks/service-hooks/useReviewService';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';
import { BadgeCheck, MessageSquare, Star, Store } from 'lucide-react';
import { useState } from 'react';
import { ReviewDto } from '@pms/types';

/**
 * The reviews block of the demo PDP, read entirely through the existing public review
 * endpoints: Published rows only, reviewer emails already stripped server-side. "Show more"
 * widens the page size instead of appending pages, so one query owns the list; the API caps
 * a public page at 50, which is also the ceiling here.
 */

const FIRST_PAGE = 5;
const MAX_VISIBLE = 50;

function Stars({ rating, size = 'sm', className }: { rating: number; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <Star key={step} className={cn(size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5', step <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted')} />
      ))}
    </span>
  );
}

function ReviewRow({ review }: { review: ReviewDto }) {
  const { formatDate } = useLocale();
  const name = review.user?.name?.trim() || 'Customer';

  return (
    <li className="rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold uppercase text-primary ring-1 ring-primary/15">
            {review.user?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={review.user.profileImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              name.slice(0, 2)
            )}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold">{name}</span>
              {review.isVerified && (
                <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck className="h-3 w-3" />
                  Verified purchase
                </span>
              )}
            </span>
            <Stars rating={review.rating} className="mt-0.5" />
          </span>
        </div>
        <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{formatDate(review.createdAt)}</span>
      </div>

      {(review.title || review.comment) && (
        <div className="mt-3 border-t border-border/50 pt-3">
          {review.title && <p className="text-sm font-semibold">{review.title}</p>}
          {review.comment && <p className={cn('whitespace-pre-line text-sm leading-relaxed text-muted-foreground', review.title && 'mt-1')}>{review.comment}</p>}
        </div>
      )}

      {review.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {review.images.map((image, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${image}-${index}`} src={image} alt={`Review photo ${index + 1}`} className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
          ))}
        </div>
      )}

      {(review.replies ?? []).map((reply) => (
        <div key={reply.id} className="mt-3 rounded-r-lg border-l-2 border-primary/40 bg-primary/[0.04] py-2.5 pl-3.5 pr-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Store className="h-3.5 w-3.5 text-primary" />
            Response from the store
            <span className="font-normal text-muted-foreground">· {formatDate(reply.createdAt)}</span>
          </p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{reply.comment}</p>
        </div>
      ))}
    </li>
  );
}

export default function ProductReviews({ productId }: { productId: number }) {
  const [visible, setVisible] = useState(FIRST_PAGE);

  const summaryQuery = useGetPublicReviewSummary(productId);
  const reviewsQuery = useGetPublicProductReviews({ productId, page: 1, recordPerPage: visible });

  const summary = summaryQuery.data?.data?.data;
  const result = reviewsQuery.data?.data?.data;
  const reviews: ReviewDto[] = result?.data ?? [];
  const total = result?.totalRecord ?? 0;

  if (summaryQuery.isPending || reviewsQuery.isPending) {
    return (
      <section className="mt-12" aria-busy="true">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
          <Skeleton className="h-56 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (reviewsQuery.isError || summaryQuery.isError) return null;

  if (total === 0) {
    return (
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Customer reviews</h2>
        <Card className="py-10 text-center">
          <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-medium">No reviews yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Reviews from verified buyers appear here once they are published.</p>
        </Card>
      </section>
    );
  }

  const average = summary?.averageRating ?? 0;
  const counts = summary?.ratingCounts ?? {};
  const totalForBars = summary?.totalReviews || total;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-2.5">
        <h2 className="text-lg font-bold tracking-tight">Customer reviews</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">{total}</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden p-0 md:sticky md:top-24 md:p-0">
          <div className="flex flex-col items-center gap-1 border-b border-border/60 bg-gradient-to-b from-amber-500/10 to-transparent px-5 py-6 text-center">
            <span className="text-5xl font-bold leading-none tabular-nums tracking-tight">{average.toFixed(1)}</span>
            <Stars rating={average} size="md" className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              Based on {totalForBars} review{totalForBars === 1 ? '' : 's'}
            </p>
          </div>

          <div className="space-y-2 px-5 py-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = counts[String(star)] ?? 0;
              const share = totalForBars ? Math.round((count / totalForBars) * 100) : 0;
              return (
                <div key={star} className={cn('flex items-center gap-2.5 text-[11px] tabular-nums', count === 0 && 'opacity-50')}>
                  <span className="flex w-7 shrink-0 items-center gap-0.5 font-medium text-muted-foreground">
                    {star}
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all" style={{ width: `${share}%` }} />
                  </span>
                  <span className="w-9 shrink-0 text-right font-medium text-muted-foreground">{share}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="min-w-0">
          <ul className={cn('space-y-3', reviewsQuery.isFetching && 'opacity-60 transition-opacity')}>
            {reviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </ul>

          {total > reviews.length && visible < MAX_VISIBLE && (
            <Button variant="outline" size="sm" className="mt-4 w-full sm:w-auto" onClick={() => setVisible((count) => Math.min(count + 10, MAX_VISIBLE))} disabled={reviewsQuery.isFetching}>
              Show more reviews ({total - reviews.length} more)
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
