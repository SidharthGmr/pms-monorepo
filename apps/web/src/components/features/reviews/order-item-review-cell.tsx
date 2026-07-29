'use client';
import StarRating from '@/components/common/star-rating';
import { Button } from '@/components/ui/button';
import { ReviewDto } from '@/dtos/review.dto';
import { Star } from 'lucide-react';
import { useState } from 'react';
import RateProductDialog from './rate-product-dialog';

interface OrderItemReviewCellProps {
  orderId: number;
  productId: number;
  productName?: string;
  /** The caller's reviews on this order, so each line knows whether it is already rated. */
  reviews: ReviewDto[];
}

/**
 * Per-line rating control on the order detail page. This is the only place a review can
 * start from: the API requires the product to sit on one of the caller's own orders.
 */
export default function OrderItemReviewCell({ orderId, productId, productName, reviews }: OrderItemReviewCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const existing = reviews.find((review) => review.productId === productId);

  return (
    <>
      {existing ? (
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setIsOpen(true)}
          title="Edit your review"
        >
          <StarRating value={existing.rating} size="sm" />
          <span className="text-xs text-muted-foreground underline-offset-2 hover:underline">Edit</span>
        </button>
      ) : (
        <Button variant="outline" size="sm" className="h-8" onClick={() => setIsOpen(true)}>
          <Star className="mr-1.5 h-3.5 w-3.5" />
          Rate
        </Button>
      )}

      {isOpen && (
        <RateProductDialog
          orderId={orderId}
          productId={productId}
          productName={productName}
          reviewId={existing?.id}
          initialRating={existing?.rating}
          initialTitle={existing?.title}
          initialComment={existing?.comment}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
