import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateReviewModel, CreateReviewReplyModel, UpdateReviewModel, UpdateReviewReplyModel } from '@/models/review.model';
import { ReviewFilterParams, ReviewReplyFilterParams } from '@/params/review.params';
import IReviewReplyService from '@/services/interfaces/IReviewReplyService';
import IReviewService from '@/services/interfaces/IReviewService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const reviewService = () => container.get<IReviewService>(TYPES.IReviewService);
const replyService = () => container.get<IReviewReplyService>(TYPES.IReviewReplyService);

/** Both lists and the per-product summary go stale together after any write. */
const invalidateReviews = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['reviews'] });
  queryClient.invalidateQueries({ queryKey: ['review-summary'] });
  queryClient.invalidateQueries({ queryKey: ['review-replies'] });
};

export const useGetAllReviews = (params?: ReviewFilterParams, enabled: boolean = true) =>
  useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewService().getAll(params),
    enabled,
  });

export const useGetReviewById = (id: number | string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewService().getById(id),
    enabled: !!id && enabled,
  });

export const useGetReviewSummary = (productId: number | string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['review-summary', productId],
    queryFn: () => reviewService().getSummary(productId),
    enabled: !!productId && enabled,
  });

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (model: CreateReviewModel) => reviewService().create(model),
    onSettled: () => invalidateReviews(queryClient),
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }: { id: number | string; model: UpdateReviewModel }) => reviewService().update(id, model),
    onSettled: () => invalidateReviews(queryClient),
  });
};

/** Staff-only status change - keeps text edits out of the moderation path. */
export const useModerateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) => reviewService().moderate(id, status),
    onSettled: () => invalidateReviews(queryClient),
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => reviewService().delete(id),
    onSettled: () => invalidateReviews(queryClient),
  });
};

export const useGetAllReviewReplies = (params?: ReviewReplyFilterParams, enabled: boolean = true) =>
  useQuery({
    queryKey: ['review-replies', params],
    queryFn: () => replyService().getAll(params),
    enabled,
  });

export const useCreateReviewReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (model: CreateReviewReplyModel) => replyService().create(model),
    onSettled: () => invalidateReviews(queryClient),
  });
};

export const useUpdateReviewReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }: { id: number | string; model: UpdateReviewReplyModel }) => replyService().update(id, model),
    onSettled: () => invalidateReviews(queryClient),
  });
};

export const useDeleteReviewReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => replyService().delete(id),
    onSettled: () => invalidateReviews(queryClient),
  });
};
