import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { EstimateConvertModel, EstimateFilterParams, EstimateModel, EstimateStatusModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateEstimate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: EstimateModel) => unitOfService.EstimateService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

const useGetAllEstimates = (params?: EstimateFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['EstimateService.getAll', params],
    queryFn: () => unitOfService.EstimateService.getAll(params),
    enabled,
  });
};

const useGetEstimateById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['EstimateService.getById', id],
    queryFn: () => unitOfService.EstimateService.getById(id),
    enabled: enabled && !!id,
  });
};

// Accepts either the database id (old links) or the per-store estimate number (EST-0001).
// Shares the getById cache key so the existing mutation invalidations refresh it too.
const useGetEstimate = (idOrNumber: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['EstimateService.getById', String(idOrNumber)],
    queryFn: () =>
      /^\d+$/.test(String(idOrNumber))
        ? unitOfService.EstimateService.getById(idOrNumber)
        : unitOfService.EstimateService.getByNumber(String(idOrNumber)),
    enabled: enabled && !!idOrNumber,
  });
};

type UpdateEstimateArgs = { id: number | string; model: EstimateModel };

const useUpdateEstimate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateEstimateArgs) => unitOfService.EstimateService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getById'] });
      }
    },
    onError: (error) => error,
  });
};

type UpdateEstimateStatusArgs = { id: number | string; model: EstimateStatusModel };

const useUpdateEstimateStatus = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateEstimateStatusArgs) => unitOfService.EstimateService.updateStatus(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getById'] });
      }
    },
    onError: (error) => error,
  });
};

const useDuplicateEstimate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.EstimateService.duplicate(id),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

const useShareEstimate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.EstimateService.share(id),
    onError: (error) => error,
  });
};

const useDeleteEstimate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.EstimateService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

type ConvertEstimateArgs = { id: number | string; model: EstimateConvertModel };

// Converting writes an order, moves stock and posts a sales voucher, so everything those
// touch is invalidated - not just the estimate list.
const useConvertEstimate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: ConvertEstimateArgs) => unitOfService.EstimateService.convert(id, model),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['EstimateService.getById'] });
        queryClient.invalidateQueries({ queryKey: ['OrderService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['PaymentService.getOutstanding'] });
        queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getDaySummary'] });
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getStatement'] });
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getTrialBalance'] });
      }
    },
    onError: (error) => error,
  });
};

export {
  useConvertEstimate,
  useCreateEstimate,
  useDeleteEstimate,
  useDuplicateEstimate,
  useGetAllEstimates,
  useGetEstimate,
  useGetEstimateById,
  useShareEstimate,
  useUpdateEstimate,
  useUpdateEstimateStatus,
};
