import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { WishlistFilterParams } from '@/params/wishlist.params';
import IWishlistService from '@/services/interfaces/IWishlistService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const wishlistService = () => container.get<IWishlistService>(TYPES.IWishlistService);

// The list and every per-product heart share one cache namespace, so a toggle on a
// product page also refreshes the wishlist page.
const invalidateWishlist = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['wishlists'] });
  queryClient.invalidateQueries({ queryKey: ['wishlist-has'] });
};

export const useGetAllWishlists = (params?: WishlistFilterParams, enabled: boolean = true) =>
  useQuery({
    queryKey: ['wishlists', params],
    queryFn: () => wishlistService().getAll(params),
    enabled,
  });

export const useGetWishlistById = (id: number | string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['wishlists', id],
    queryFn: () => wishlistService().getById(id),
    enabled: !!id && enabled,
  });

export const useIsInWishlist = (productId: number | string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['wishlist-has', productId],
    queryFn: () => wishlistService().has(productId),
    enabled: !!productId && enabled,
  });

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => wishlistService().add(productId),
    onSettled: () => invalidateWishlist(queryClient),
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => wishlistService().remove(id),
    onSettled: () => invalidateWishlist(queryClient),
  });
};

export const useRemoveProductFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number | string) => wishlistService().removeByProduct(productId),
    onSettled: () => invalidateWishlist(queryClient),
  });
};
