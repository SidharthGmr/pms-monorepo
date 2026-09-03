import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { RateProductVariantModel, } from '@/models/product-variant.model';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Public storefront listing - active variants of published products, no login needed. */
const useGetAllPublicProductVariants = (params?: ProductVariantFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['ProductVariantService.getAllPublic', params],
        queryFn: async () => {
            return await unitOfService.ProductVariantService.getAllPublic(params);
        },
        enabled,
    });
};

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

/** One variant by its own id — what the store-wide edit screen loads. */
const useGetProductVariantById = (id: number | string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['ProductVariantService.getById', id],
        queryFn: async () => {
            return await unitOfService.ProductVariantService.getById(id);
        },
        enabled: enabled && !!id,
    });
};

/** Rates a variant. Re-rating replaces the caller's own score rather than adding a vote. */
const useRateProductVariant = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, model }: { id: number; model: RateProductVariantModel }) => {
            return unitOfService.ProductVariantService.rate(id, model);
        },
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getById'] });
                queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getByProductId'] });
                queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getAll'] });
                queryClient.invalidateQueries({ queryKey: ['ProductVariantService.getAllPublic'] });
            }
        },
        onError: (error) => error,
    });
};

const useCreateProductVariant = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (model: ProductVariantModel) => {
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
        mutationFn: async ({ id, model }: { id: number; model: ProductVariantModel }) => {
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

export {
    useGetProductVariants,
    useGetAllProductVariants,
    useGetProductVariantById,
    useGetAllPublicProductVariants,
    useCreateProductVariant,
    useUpdateProductVariant,
    useRateProductVariant,
};
