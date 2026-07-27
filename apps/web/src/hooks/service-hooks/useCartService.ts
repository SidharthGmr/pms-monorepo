import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { AddToCartModel, UpdateCartItemModel } from '@/models/cart.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const CART_KEY = 'CartService.getActive';

const useGetActiveCart = (userId?: string | null, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: [CART_KEY, userId ?? null],
    queryFn: async () => {
      return await unitOfService.CartService.getActive(userId);
    },
    enabled,
  });
};

const useAddToCart = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (model: AddToCartModel) => {
      return unitOfService.CartService.addProducts(model);
    },
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      }
    },
    onError: (error) => error,
  });
};

type UpdateCartQuantityArgs = { productId: number; model: UpdateCartItemModel };

const useUpdateCartQuantity = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, model }: UpdateCartQuantityArgs) => {
      return unitOfService.CartService.updateQuantity(productId, model);
    },
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      }
    },
    onError: (error) => error,
  });
};

type RemoveFromCartArgs = { productId: number; userId?: string | null };

const useRemoveFromCart = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, userId }: RemoveFromCartArgs) => {
      return unitOfService.CartService.removeProduct(productId, userId);
    },
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      }
    },
    onError: (error) => error,
  });
};

const useClearCart = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId?: string | null) => {
      return unitOfService.CartService.clear(userId);
    },
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      }
    },
    onError: (error) => error,
  });
};

export { useGetActiveCart, useAddToCart, useUpdateCartQuantity, useRemoveFromCart, useClearCart };
