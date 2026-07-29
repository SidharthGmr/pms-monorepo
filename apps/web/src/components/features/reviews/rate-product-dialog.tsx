'use client';
import StarRating from '@/components/common/star-rating';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useCreateReview, useUpdateReview } from '@/hooks/service-hooks/useReviewService';
import { CreateReviewModel } from '@/models/review.model';
import ReviewSchema from '@/schema/reviewSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

interface RateProductDialogProps {
  /** Required to create - the API only accepts a review for a product on your own order. */
  orderId: number;
  productId: number;
  productName?: string;
  /** Set to edit an existing review instead of writing a new one. */
  reviewId?: number;
  initialRating?: number;
  initialTitle?: string | null;
  initialComment?: string | null;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

type RateFormValues = Pick<CreateReviewModel, 'rating' | 'title' | 'comment'>;

export default function RateProductDialog({
  orderId,
  productId,
  productName,
  reviewId,
  initialRating,
  initialTitle,
  initialComment,
  isOpen,
  onClose,
}: RateProductDialogProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!reviewId && reviewId > 0;

  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();

  const form = useForm<RateFormValues>({
    resolver: yupResolver(ReviewSchema),
    defaultValues: {
      rating: initialRating ?? 0,
      title: initialTitle ?? '',
      comment: initialComment ?? '',
    },
  });

  const submitData = async (values: RateFormValues) => {
    const payload = {
      rating: values.rating,
      title: values.title?.trim() ? values.title.trim() : null,
      comment: values.comment?.trim() ? values.comment.trim() : null,
    };

    const result = isEdit
      ? await updateMutation.mutateAsync({ id: reviewId!, model: payload })
      : await createMutation.mutateAsync({ orderId, productId, ...payload });

    if (result && (result.status === 200 || result.status === 201)) {
      toast({ variant: 'success', title: isEdit ? 'Review updated' : 'Thanks for your review!' });
      onClose(true);
      return;
    }

    const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
    toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit your review' : 'Rate this product'}</DialogTitle>
        </DialogHeader>

        {productName && <p className="-mt-2 text-sm text-muted-foreground">{productName}</p>}

        <Form {...form}>
          <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your rating *</FormLabel>
                  <FormControl>
                    <div>
                      <StarRating value={field.value ?? 0} onChange={(value) => field.onChange(value)} size="lg" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input placeholder="Sum it up in a line" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your review</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="What did you like or dislike?" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    {isEdit
                      ? 'An admin may have already replied — edits keep the conversation.'
                      : 'Reviews on delivered orders are marked as verified purchases.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {isEdit ? 'Save Review' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
