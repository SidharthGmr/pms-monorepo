'use client';
import StarRating from '@/components/common/star-rating';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ReviewDto } from '@/dtos/review.dto';
import { useCreateReviewReply, useDeleteReviewReply, useUpdateReviewReply } from '@/hooks/service-hooks/useReviewService';
import { CreateReviewReplyModel } from '@/models/review.model';
import { ReviewReplySchema } from '@/schema/reviewSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface ReviewReplyDialogProps {
  review: ReviewDto;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

type ReplyFormValues = Pick<CreateReviewReplyModel, 'comment'>;

/** Staff-facing: shows the review being answered, its existing replies, and a compose box. */
export default function ReviewReplyDialog({ review, isOpen, onClose }: ReviewReplyDialogProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const createMutation = useCreateReviewReply();
  const updateMutation = useUpdateReviewReply();
  const deleteMutation = useDeleteReviewReply();

  // Set while editing one of the existing replies instead of composing a new one.
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);

  const form = useForm<ReplyFormValues>({
    resolver: yupResolver(ReviewReplySchema),
    defaultValues: { comment: '' },
  });

  const submitData = async (values: ReplyFormValues) => {
    const comment = values.comment.trim();
    const result = editingReplyId
      ? await updateMutation.mutateAsync({ id: editingReplyId, model: { comment } })
      : await createMutation.mutateAsync({ reviewId: review.id, comment });

    if (result && (result.status === 200 || result.status === 201)) {
      toast({ variant: 'success', title: editingReplyId ? 'Reply updated' : 'Reply posted' });
      form.reset({ comment: '' });
      setEditingReplyId(null);
      onClose(true);
      return;
    }

    const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
    toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
  };

  const handleDeleteReply = async (replyId: number) => {
    const result = await deleteMutation.mutateAsync(replyId);
    if (result && (result.status === 200 || result.status === 204)) {
      toast({ variant: 'success', title: 'Reply deleted' });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reply to Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 rounded-md border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{review.user?.name || review.userId}</span>
            <StarRating value={review.rating} size="sm" />
          </div>
          {review.title && <p className="text-sm font-medium">{review.title}</p>}
          {review.comment && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{review.comment}</p>}
        </div>

        {!!review.replies?.length && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Existing replies</span>
            {review.replies.map((reply) => (
              <div key={reply.id} className="space-y-1.5 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{reply.user?.name || reply.userId}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() => {
                        setEditingReplyId(reply.id);
                        form.reset({ comment: reply.comment });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDeleteReply(reply.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{reply.comment}</p>
              </div>
            ))}
          </div>
        )}

        <Form {...form}>
          <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-3">
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{editingReplyId ? 'Edit reply' : 'Your reply'} *</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Answer the customer..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              {editingReplyId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingReplyId(null);
                    form.reset({ comment: '' });
                  }}
                >
                  Cancel Edit
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Close
              </Button>
              <Button type="submit" loading={isLoading}>
                {editingReplyId ? 'Save Reply' : 'Post Reply'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
