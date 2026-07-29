import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '@/models/price-history.model';
import { PriceHistoryFilterParams } from '@/params/price-history.params';
import IPriceHistoryService from '@/services/interfaces/IPriceHistoryService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const priceHistoryService = () => container.get<IPriceHistoryService>(TYPES.IPriceHistoryService);

/**
 * A price write also rewrites the variant's cached sellingPrice/costPrice, which
 * products and variant listings read - so those namespaces go stale too.
 */
const invalidatePriceData = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['price-histories'] });
  queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getByProductId'] });
  queryClient.invalidateQueries({ queryKey: ['ProductService.getAll'] });
};

export const useGetAllPriceHistories = (params?: PriceHistoryFilterParams, enabled: boolean = true) =>
  useQuery({
    queryKey: ['price-histories', params],
    queryFn: () => priceHistoryService().getAll(params),
    enabled,
  });

export const useGetPriceHistoryById = (id: number | string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['price-histories', id],
    queryFn: () => priceHistoryService().getById(id),
    enabled: !!id && enabled,
  });

export const useGetPriceHistoryByVariant = (
  variantId: number | string,
  params?: { page?: number; recordPerPage?: number },
  enabled: boolean = true
) =>
  useQuery({
    queryKey: ['price-histories', 'by-variant', variantId, params],
    queryFn: () => priceHistoryService().getByVariant(variantId, params),
    enabled: !!variantId && enabled,
  });

export const useGetPriceHistorySummary = (variantId: number | string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['price-histories', 'summary', variantId],
    queryFn: () => priceHistoryService().getSummary(variantId),
    enabled: !!variantId && enabled,
  });

/** The price effective on a date - defaults to now when `date` is omitted. */
export const useGetEffectivePrice = (variantId: number | string, date?: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['price-histories', 'effective', variantId, date],
    queryFn: () => priceHistoryService().getEffective(variantId, date),
    enabled: !!variantId && enabled,
  });

export const useCreatePriceHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (model: CreatePriceHistoryModel) => priceHistoryService().create(model),
    onSettled: () => invalidatePriceData(queryClient),
  });
};

export const useUpdatePriceHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }: { id: number | string; model: UpdatePriceHistoryModel }) => priceHistoryService().update(id, model),
    onSettled: () => invalidatePriceData(queryClient),
  });
};

export const useDeletePriceHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => priceHistoryService().delete(id),
    onSettled: () => invalidatePriceData(queryClient),
  });
};
