import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreatePurchaseModel } from '@/services/PurchaseService';
import { IPurchaseService } from '@/services/interfaces/IPurchaseService';
import { PurchaseFilterParams } from '@/params/purchase.params';

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  const purchaseService = container.get<IPurchaseService>(TYPES.IPurchaseService);

  return useMutation({
    mutationFn: (model: CreatePurchaseModel) => purchaseService.createPurchase(model),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
};

export const useGetAllPurchases = (params?: PurchaseFilterParams) => {
  const purchaseService = container.get<IPurchaseService>(TYPES.IPurchaseService);
  return useQuery({
    queryKey: ['purchases', params],
    queryFn: () => purchaseService.getAll(params),
  });
};

export const useGetPurchaseById = (id: number | string) => {
  const purchaseService = container.get<IPurchaseService>(TYPES.IPurchaseService);
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: () => purchaseService.getById(id),
    enabled: !!id,
  });
};
