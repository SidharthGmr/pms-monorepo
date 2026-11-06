import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { EstimateFilterParams, EstimateModel } from '@pms/types';
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

export { useCreateEstimate, useDeleteEstimate, useGetAllEstimates, useGetEstimateById, useUpdateEstimate };
