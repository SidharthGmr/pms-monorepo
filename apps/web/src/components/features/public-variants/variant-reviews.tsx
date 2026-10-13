'use client';
import StarRating from '@/components/common/star-rating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewDto } from '@/dtos/review.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useGetOrdersByCustomerId } from '@/hooks/service-hooks/useOrderService';
import { useGetAllReviews, useGetPublicProductReviews, useGetPublicReviewSummary } from '@/hooks/service-hooks/useReviewService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import { BadgeCheck, LogIn, MessageSquarePlus, MessageSquareText, PencilLine, Star } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import RateProductDialog from '../reviews/rate-product-dialog';

const PAGE_SIZE = 5;

const formatDate = (value: string | Date | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const initials = (name?: string | null) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?';

interface VariantReviewsProps {
  productId: number;
  productName: string;
}

/**
 * Published reviews of the product this variant belongs to, on the public storefront.
 * Reading needs no account (the public endpoints return Published rows only); writing is
 * for signed-in shoppers with an order that contains this product, which is also what the
 * API enforces on create. Everyone else is told exactly which of the two they are missing.
 */
export default function VariantReviews({ productId, productName }: VariantReviewsProps) {
  const { currentUser, isAuthenticated } = useGetCurrentUser();
  // The session exposes the decoded token on public pages and the UserDto shape on
  // dashboard ones, so accept whichever id field is present.
  const userId = currentUser?.usersId ?? (currentUser as unknown as { userId?: string } | undefined)?.userId;

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showRateDialog, setShowRateDialog] = useState(false);

  const summaryQuery = useGetPublicReviewSummary(productId);
  const listQuery = useGetPublicProductReviews({ productId, page: 1, recordPerPage: visible });

  // Signed-in extras: their own reviews (any status, so a pending one still reads as
  // "already reviewed") and an order of theirs that contains this product. The reviews are
  // fetched without a productId filter on purpose - the API treats customer+productId as a
  // public product read and would return everyone's reviews instead of only theirs.
  const myReviewsQuery = useGetAllReviews({ userId, showAllRecords: true }, !!userId);
  const ordersQuery = useGetOrdersByCustomerId(userId ?? '', undefined, !!userId);

  const summary = summaryQuery.data?.data?.data;
  const reviews = useMemo<ReviewDto[]>(() => listQuery.data?.data?.data?.data ?? [], [listQuery.data]);
  const totalRecord = listQuery.data?.data?.data?.totalRecord ?? 0;

  const myReviews = useMemo<ReviewDto[]>(
    () => (myReviewsQuery.data?.data?.data?.data ?? []).filter((review) => review.productId === productId),
    [myReviewsQuery.data, productId]
  );
  const myReview = myReviews[0];

  // An order qualifies when it holds this product and has not already been used for a review.
  const eligibleOrderId = useMemo(() => {
    const orders = ordersQuery.data?.data?.data?.data ?? [];
    const reviewedOrderIds = new Set(myReviews.map((review) => review.orderId));
    return orders.find(
      (order) =>
        order.status !== OrderStatus.Cancelled &&
        !reviewedOrderIds.has(order.id) &&
        (order.items ?? []).some((item) => item.productId === productId)
    )?.id;
  }, [ordersQuery.data, myReviews, productId]);

  const average = summary?.averageRating ?? 0;
  const totalReviews = summary?.totalReviews ?? totalRecord;
  const counts = summary?.ratingCounts ?? {};
  const loading = listQuery.isPending || summaryQuery.isPending;

  return (
    <Card className="rounded-2xl border border-border/60 shadow-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Customer reviews</h2>
          <p className="text-sm text-muted-foreground">
            {totalReviews === 0 ? 'No reviews for this product yet' : `${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'} from shoppers`}
          </p>
        </div>

        {/* Who may write: a shopper who bought it. Everyone else learns what is missing. */}
        {!isAuthenticated ? (
          <Button asChild variant="outline" size="sm" className="w-fit gap-1.5">
            <Link href="/login">
              <LogIn className="h-3.5 w-3.5" />
              Log in to add a review
            </Link>
          </Button>
        ) : myReview ? (
          <Button type="button" variant="outline" size="sm" className="w-fit gap-1.5" onClick={() => setShowRateDialog(true)}>
            <PencilLine className="h-3.5 w-3.5" />
            Edit your review
          </Button>
        ) : eligibleOrderId ? (
          <Button type="button" size="sm" className="w-fit gap-1.5" onClick={() => setShowRateDialog(true)}>
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Write a review
          </Button>
        ) : (
          !ordersQuery.isPending && <p className="text-xs text-muted-foreground">Only shoppers who bought this product can review it.</p>
        )}
      </div>

      {loading ? (
        <div className="mt-5 space-y-4" aria-busy="true" aria-label="Loading reviews">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : listQuery.isError ? (
        <p className="mt-5 text-sm text-muted-foreground">Could not load reviews right now. Refresh the page to try again.</p>
      ) : totalReviews === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 px-6 py-10 text-center">
          <MessageSquareText className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm font-medium">Be the first to review {productName}</p>
          <p className="text-xs text-muted-foreground">
            {isAuthenticated ? 'Bought it? Tell other shoppers what you think.' : 'Log in and tell other shoppers what you think.'}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* The aggregate: one number, then how the stars are spread. */}
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold leading-none tracking-tight">{average.toFixed(1)}</span>
              <span className="pb-0.5 text-sm text-muted-foreground">out of 5</span>
            </div>
            <StarRating value={Math.round(average)} size="sm" />
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = counts[star] ?? 0;
                const share = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="flex w-7 shrink-0 items-center gap-0.5 font-medium tabular-nums">
                      {star}
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${share}%` }} />
                    </span>
                    <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {reviews.map((review) => (
              <article key={review.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  {review.user?.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.user.profileImageUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {initials(review.user?.name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={cn('text-sm font-semibold capitalize', review.userId === userId && 'text-primary')}>
                        {review.userId === userId ? 'You' : review.user?.name || 'Shopper'}
                      </span>
                      {review.isVerified && (
                        <Badge variant="green" className="gap-1 rounded-full px-1.5 py-0 text-[10px] font-semibold">
                          <BadgeCheck className="h-3 w-3" />
                          Verified purchase
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                    </div>
                    <StarRating value={review.rating} size="sm" className="mt-1" />
                    {review.title && <p className="mt-1.5 text-sm font-semibold">{review.title}</p>}
                    {review.comment && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}

                    {(review.replies ?? []).map((reply) => (
                      <div key={reply.id} className="mt-3 rounded-xl border-l-2 border-primary/30 bg-muted/40 px-3 py-2">
                        <p className="text-xs font-semibold">
                          {reply.user?.name || 'Store'} <span className="font-normal text-muted-foreground">· Store response · {formatDate(reply.createdAt)}</span>
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{reply.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}

            {totalRecord > visible && (
              <div className="pt-4 text-center">
                <Button type="button" variant="outline" size="sm" onClick={() => setVisible((current) => current + PAGE_SIZE)}>
                  Show more reviews ({totalRecord - visible} left)
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {showRateDialog && (myReview || eligibleOrderId) && (
        <RateProductDialog
          orderId={myReview?.orderId ?? (eligibleOrderId as number)}
          productId={productId}
          productName={productName}
          reviewId={myReview?.id}
          initialRating={myReview?.rating}
          initialTitle={myReview?.title}
          initialComment={myReview?.comment}
          isOpen={showRateDialog}
          onClose={() => setShowRateDialog(false)}
        />
      )}
    </Card>
  );
}
