import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CreateSubscriberModel, SubscriberFilterParams } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useSubscribePublic = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: (model: CreateSubscriberModel) => unitOfService.SubscriberService.subscribePublic(model),
    onError: (error) => error,
  });
};

const useGetAllSubscribers = (params?: SubscriberFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['SubscriberService.getAll', params],
    queryFn: () => unitOfService.SubscriberService.getAll(params),
    enabled,
  });
};

const useDeleteSubscriber = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.SubscriberService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['SubscriberService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

export { useDeleteSubscriber, useGetAllSubscribers, useSubscribePublic };
