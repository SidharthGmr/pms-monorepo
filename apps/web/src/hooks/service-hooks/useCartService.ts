import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { AddToCartModel, UpdateCartItemModel } from '@pms/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const CART_KEY = 'CartService.getActive';

const useGetActiveCart = (enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: [CART_KEY],
    queryFn: async () => {
      return await unitOfService.CartService.getActive();
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

type RemoveFromCartArgs = { productId: number };

const useRemoveFromCart = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId }: RemoveFromCartArgs) => {
      return unitOfService.CartService.removeProduct(productId);
    },
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      }
    },
    onError: (error) => error,
  });
};

type UpdateCartVariantQuantityArgs = { variantId: number; model: UpdateCartItemModel };

/** Sets an absolute quantity for one cart line. Cart lines are keyed by variant, so prefer this. */
const useUpdateCartVariantQuantity = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ variantId, model }: UpdateCartVariantQuantityArgs) => {
      return unitOfService.CartService.updateVariantQuantity(variantId, model);
    },
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      }
    },
    onError: (error) => error,
  });
};

/** Removes one cart line by its variant. */
const useRemoveCartVariant = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantId: number) => {
      return unitOfService.CartService.removeVariant(variantId);
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
    mutationFn: async () => {
      return unitOfService.CartService.clear();
    },
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      }
    },
    onError: (error) => error,
  });
};

export {
  useGetActiveCart,
  useAddToCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useUpdateCartVariantQuantity,
  useRemoveCartVariant,
  useClearCart,
};
