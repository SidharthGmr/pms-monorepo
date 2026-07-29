'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { PageHeader } from '@/components/common/page-header';
import StarRating from '@/components/common/star-rating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ReviewDto } from '@/dtos/review.dto';
import { StatusValues } from '@/enums/status-values.enum';
import { useDeleteReview, useGetAllReviews } from '@/hooks/service-hooks/useReviewService';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import RateProductDialog from '../rate-product-dialog';

const statusVariant = (status: string) => {
  if (status === StatusValues.Published) return 'green';
  if (status === StatusValues.Draft) return 'orange';
  return 'rose';
};

/**
 * The signed-in user's own reviews.
 *
 * `userId` is sent explicitly even though the API pins a plain customer to their own
 * rows: this page is also reachable by STAFF, whom the API treats as staff and would
 * otherwise hand every user's reviews. The query waits for the session so the first
 * request is never the unscoped one.
 */
export default function MyReviewsList() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { currentUser } = useGetCurrentUser();
  const [page, setPage] = useState(1);

  const userId = currentUser?.usersId;
  const {
    data: response,
    isLoading,
    isError,
  } = useGetAllReviews({ userId, page, recordPerPage: config.recordPerPage }, !!userId);
  const deleteMutation = useDeleteReview();

  const { showModal: showEditModal, openModal: openEditModal, closeModal: closeEditModal, uniqueId: editId } = useModalShowHide();
  const { showModal: showDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal, uniqueId: deleteId } = useModalShowHide();

  const reviews = useMemo<ReviewDto[]>(() => response?.data?.data?.data ?? [], [response]);
  const totalRecord = response?.data?.data?.totalRecord ?? 0;
  const hasMore = reviews.length > 0 && page * config.recordPerPage < totalRecord;

  const editing = reviews.find((review) => review.id === +(editId ?? 0));

  const handleDelete = async (id: number) => {
    const result = await deleteMutation.mutateAsync(id);
    if (result && (result.status === 200 || result.status === 204)) {
      toast({ variant: 'success', title: 'Review deleted' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
    closeDeleteModal(true);
  };

  return (
    <>
      <PageHeader title="My Reviews" description="Ratings you have left, and any replies from the store" variant="back" />

      {(isLoading || !userId) && (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && <div className="py-10 text-center text-destructive">Error loading your reviews</div>}

      {!isLoading && !isError && !!userId && reviews.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <Star className="h-8 w-8 text-muted-foreground/40" />
          <span className="font-medium">You have not reviewed anything yet</span>
          <span className="text-sm text-muted-foreground">Open a delivered order and rate the products you received.</span>
        </Card>
      )}

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{review.product?.name || `Product #${review.productId}`}</span>
                  {review.isVerified && (
                    <Badge variant="green" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified purchase
                    </Badge>
                  )}
                  <Badge variant={statusVariant(review.status as string)}>{review.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    Order #{review.orderId} ·{' '}
                    {review.createdAt ? unitOfService.DateTimeService.convertToLocalDate(review.createdAt as unknown as Date, true) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(review.id)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openDeleteModal(review.id)}>
                  Delete
                </Button>
              </div>
            </div>

            {review.title && <p className="font-medium">{review.title}</p>}
            {review.comment && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{review.comment}</p>}

            {!!review.replies?.length && (
              <div className="space-y-2 border-l-2 border-primary/20 pl-4">
                {review.replies.map((reply) => (
                  <div key={reply.id} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      {reply.user?.name || 'Store'} replied
                      <span className="font-normal text-muted-foreground">
                        {reply.createdAt ? unitOfService.DateTimeService.convertToLocalDate(reply.createdAt as unknown as Date, true) : ''}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{reply.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} · {totalRecord} review{totalRecord === 1 ? '' : 's'}
          </span>
          <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage((prev) => prev + 1)}>
            Next
          </Button>
        </div>
      )}

      {showEditModal && editing && (
        <RateProductDialog
          orderId={editing.orderId}
          productId={editing.productId}
          productName={editing.product?.name}
          reviewId={editing.id}
          initialRating={editing.rating}
          initialTitle={editing.title}
          initialComment={editing.comment}
          isOpen={showEditModal}
          onClose={(refresh) => closeEditModal(refresh)}
        />
      )}

      {showDeleteModal && deleteId && (
        <ConfirmBox
          isOpen={showDeleteModal}
          onClose={() => closeDeleteModal(false)}
          onSubmit={() => handleDelete(+deleteId)}
          heading="Delete Review"
          loading={deleteMutation.isPending}
          bodyText="Your rating and comment will be removed from the product page."
        />
      )}
    </>
  );
}
