import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateOrderItemModel, UpdateOrderItemModel } from '@/models/order-item.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateOrderItem = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: CreateOrderItemModel) => unitOfService.OrderItemService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['OrderItemService.getByOrderId'] });
      }
    },
    onError: (error) => error,
  });
};

const useGetOrderItemById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['OrderItemService.getById', id],
    queryFn: () => unitOfService.OrderItemService.getById(id),
    enabled: enabled && !!id,
  });
};

const useGetOrderItemsByOrderId = (orderId: number, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['OrderItemService.getByOrderId', orderId],
    queryFn: () => unitOfService.OrderItemService.getByOrderId(orderId),
    enabled: enabled && !!orderId,
  });
};

type UpdateOrderItemArgs = { id: number | string; model: UpdateOrderItemModel };

const useUpdateOrderItem = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateOrderItemArgs) => unitOfService.OrderItemService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['OrderItemService.getByOrderId'] });
      }
    },
    onError: (error) => error,
  });
};

const useDeleteOrderItem = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.OrderItemService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 204) {
        queryClient.invalidateQueries({ queryKey: ['OrderItemService.getByOrderId'] });
      }
    },
    onError: (error) => error,
  });
};

export {
  useCreateOrderItem, useDeleteOrderItem, useGetOrderItemById,
  useGetOrderItemsByOrderId,
  useUpdateOrderItem
};

