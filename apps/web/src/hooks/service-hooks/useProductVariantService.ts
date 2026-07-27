import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateProductVariantModel } from '@/models/product-variant.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
                queryClient.invalidateQueries({ queryKey: ['ProductService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

export { useGetProductVariants, useCreateProductVariant };
