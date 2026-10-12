import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ContactMessageFilterParams, CreateContactMessageModel, UpdateContactMessageStatusModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreatePublicContactMessage = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: (model: CreateContactMessageModel) => unitOfService.ContactMessageService.createPublic(model),
    onError: (error) => error,
  });
};

const useGetAllContactMessages = (params?: ContactMessageFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['ContactMessageService.getAll', params],
    queryFn: () => unitOfService.ContactMessageService.getAll(params),
    enabled,
  });
};

const useGetContactMessageById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['ContactMessageService.getById', id],
    queryFn: () => unitOfService.ContactMessageService.getById(id),
    enabled: enabled && !!id,
  });
};

type UpdateContactMessageStatusArgs = { id: number | string; model: UpdateContactMessageStatusModel };

const useUpdateContactMessageStatus = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateContactMessageStatusArgs) => unitOfService.ContactMessageService.updateStatus(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['ContactMessageService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['ContactMessageService.getById'] });
      }
    },
    onError: (error) => error,
  });
};

const useDeleteContactMessage = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.ContactMessageService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['ContactMessageService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

export {
  useCreatePublicContactMessage,
  useDeleteContactMessage,
  useGetAllContactMessages,
  useGetContactMessageById,
  useUpdateContactMessageStatus
};
