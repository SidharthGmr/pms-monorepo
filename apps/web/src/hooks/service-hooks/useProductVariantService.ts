import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateProductVariantModel, UpdateProductVariantModel } from '@/models/product-variant.model';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** The store-wide SKU list. Unlike `useGetProductVariants`, needs no product. */
const useGetAllProductVariants = (params?: ProductVariantFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['ProductVariantService.getAll', params],
        queryFn: async () => {
            return await unitOfService.ProductVariantService.getAll(params);
        },
        enabled,
    });
};

const useGetProductVariants = (
    productId: number | string,
    params?: { page?: number; recordPerPage?: number },
    enabled: boolean = true
) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['ProductVariantService.getByProductId', productId, params],
        queryFn: async () => {
            return await unitOfService.ProductVariantService.getByProductId(productId, params);
        },
        enabled: enabled && !!productId,
    });
};

const useCreateProductVariant = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (model: CreateProductVariantModel) => {
            return unitOfService.ProductVariantService.create(model);
        },
        onSettled: (response) => {
            if (response && response.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getByProductId'] });
                queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getAll'] });
                queryClient.invalidateQueries({ queryKey: ['ProductService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useUpdateProductVariant = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, model }: { id: number; model: UpdateProductVariantModel }) => {
            return unitOfService.ProductVariantService.update(id, model);
        },
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getByProductId'] });
                queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getAll'] });
                queryClient.invalidateQueries({ queryKey: ['ProductService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

export { useGetProductVariants, useGetAllProductVariants, useCreateProductVariant, useUpdateProductVariant };
