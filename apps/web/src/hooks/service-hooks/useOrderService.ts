import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateOrderModel, UpdateOrderModel } from '@/models/order.model';
import { OrderFilterParams } from '@/params/order.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateOrder = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: CreateOrderModel) => unitOfService.OrderService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['OrderService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

const useGetAllOrders = (params?: OrderFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['OrderService.getAll', params],
    queryFn: () => unitOfService.OrderService.getAll(params),
    enabled,
  });
};

const useGetOrderById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['OrderService.getById', id],
    queryFn: () => unitOfService.OrderService.getById(id),
    enabled: enabled && !!id,
  });
};

const useGetOrdersByCustomerId = (customerId: string, params?: OrderFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['OrderService.getByCustomerId', customerId, params],
    queryFn: () => unitOfService.OrderService.getByCustomerId(customerId, params),
    enabled: enabled && !!customerId,
  });
};

type UpdateOrderArgs = { id: number | string; model: UpdateOrderModel };

const useUpdateOrder = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateOrderArgs) => unitOfService.OrderService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['OrderService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

const useDeleteOrder = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.OrderService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 204) {
        queryClient.invalidateQueries({ queryKey: ['OrderService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

export {
  useCreateOrder, useDeleteOrder, useGetAllOrders,
  useGetOrderById,
  useGetOrdersByCustomerId,
  useUpdateOrder
};

