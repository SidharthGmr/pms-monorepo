import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { TaxFilterParams, TaxModel } from '@pms/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateTax = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: TaxModel) => unitOfService.TaxService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['TaxService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

const useGetAllTaxes = (params?: TaxFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['TaxService.getAll', params],
    queryFn: () => unitOfService.TaxService.getAll(params),
    enabled,
  });
};

const useGetTaxById = (id: string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['TaxService.getById', id],
    queryFn: () => unitOfService.TaxService.getById(id),
    enabled: enabled && !!id,
  });
};

type UpdateTaxArgs = { id: string; model: TaxModel };

const useUpdateTax = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateTaxArgs) => unitOfService.TaxService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['TaxService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

const useDeleteTax = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unitOfService.TaxService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['TaxService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

export { useCreateTax, useGetAllTaxes, useGetTaxById, useUpdateTax, useDeleteTax };
