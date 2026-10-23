import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { OrderReturnFilterParams, OrderReturnModel, OrderReturnStatusModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// A return touches the order it belongs to and, through restock/exchange, the product catalog -
// every write refreshes all three families.
const invalidateReturnQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['OrderReturnService.getAll'] });
  queryClient.invalidateQueries({ queryKey: ['OrderReturnService.getById'] });
  queryClient.invalidateQueries({ queryKey: ['OrderReturnService.getReturnedQuantities'] });
  queryClient.invalidateQueries({ queryKey: ['OrderService.getAll'] });
  queryClient.invalidateQueries({ queryKey: ['OrderService.getById'] });
  queryClient.invalidateQueries({ queryKey: ['ProductService.getAll'] });
};

const useCreateOrderReturn = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: OrderReturnModel) => unitOfService.OrderReturnService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) invalidateReturnQueries(queryClient);
    },
    onError: (error) => error,
  });
};

const useGetAllOrderReturns = (params?: OrderReturnFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['OrderReturnService.getAll', params],
    queryFn: () => unitOfService.OrderReturnService.getAll(params),
    enabled,
  });
};

const useGetOrderReturnById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['OrderReturnService.getById', id],
    queryFn: () => unitOfService.OrderReturnService.getById(id),
    enabled: enabled && !!id,
  });
};

const useGetReturnedQuantities = (orderId: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['OrderReturnService.getReturnedQuantities', orderId],
    queryFn: () => unitOfService.OrderReturnService.getReturnedQuantities(orderId),
    enabled: enabled && !!orderId,
  });
};

type UpdateOrderReturnArgs = { id: number | string; model: OrderReturnModel };

const useUpdateOrderReturn = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateOrderReturnArgs) => unitOfService.OrderReturnService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) invalidateReturnQueries(queryClient);
    },
    onError: (error) => error,
  });
};

type UpdateOrderReturnStatusArgs = { id: number | string; model: OrderReturnStatusModel };

const useUpdateOrderReturnStatus = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateOrderReturnStatusArgs) => unitOfService.OrderReturnService.updateStatus(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) invalidateReturnQueries(queryClient);
    },
    onError: (error) => error,
  });
};

const useDeleteOrderReturn = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.OrderReturnService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) invalidateReturnQueries(queryClient);
    },
    onError: (error) => error,
  });
};

export {
  useCreateOrderReturn,
  useGetAllOrderReturns,
  useGetOrderReturnById,
  useGetReturnedQuantities,
  useUpdateOrderReturn,
  useUpdateOrderReturnStatus,
  useDeleteOrderReturn,
};
