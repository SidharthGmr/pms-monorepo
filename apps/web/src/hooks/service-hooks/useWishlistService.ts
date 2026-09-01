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
  queryClient.invalidateQueries({ queryKey: ['wishlist-has-variant'] });
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

/** Without `variantId` this reports the product-level save, not "any SKU of this product". */
export const useIsInWishlist = (productId: number | string, enabled: boolean = true, variantId?: number) =>
  useQuery({
    queryKey: ['wishlist-has', productId, variantId ?? null],
    queryFn: () => wishlistService().has(productId, variantId),
    enabled: !!productId && enabled,
  });

/** For a grid that rendered SKUs and has no parent product id to hand. */
export const useIsVariantInWishlist = (variantId: number, enabled: boolean = true) =>
  useQuery({
    queryKey: ['wishlist-has-variant', variantId],
    queryFn: () => wishlistService().hasVariant(variantId),
    enabled: !!variantId && enabled,
  });

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) => wishlistService().add(variantId),
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
    mutationFn: ({ productId, variantId }: { productId: number | string; variantId?: number }) =>
      wishlistService().removeByProduct(productId, variantId),
    onSettled: () => invalidateWishlist(queryClient),
  });
};

export const useRemoveVariantFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) => wishlistService().removeByVariant(variantId),
    onSettled: () => invalidateWishlist(queryClient),
  });
};
