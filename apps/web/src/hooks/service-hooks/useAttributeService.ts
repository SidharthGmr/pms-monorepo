import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateAttributeModel, UpdateAttributeModel } from '@/models/attribute.model';
import { AttributeFilterParams } from '@/params/attribute.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateAttribute = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: CreateAttributeModel) =>
      unitOfService.AttributeService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['AttributeService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

const useGetAllAttributes = (params?: AttributeFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['AttributeService.getAll', params],
    queryFn: () => unitOfService.AttributeService.getAll(params),
    enabled,
  });
};

const useGetAttributeById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['AttributeService.getById', id],
    queryFn: () => unitOfService.AttributeService.getById(id),
    enabled: enabled && !!id,
  });
};

type UpdateAttributeArgs = { id: number | string; model: UpdateAttributeModel };

const useUpdateAttribute = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateAttributeArgs) =>
      unitOfService.AttributeService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['AttributeService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

const useDeleteAttribute = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.AttributeService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 204) {
        queryClient.invalidateQueries({ queryKey: ['AttributeService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

export {
  useCreateAttribute, useDeleteAttribute, useGetAllAttributes,
  useGetAttributeById,
  useUpdateAttribute
};

