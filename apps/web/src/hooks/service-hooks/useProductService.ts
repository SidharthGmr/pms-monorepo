import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateProductModel, UpdateProductModel } from '@/models/product.model';
import { ProductFilterParams } from '@/params/product.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateProduct = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (model: CreateProductModel) => {
            return unitOfService.ProductService.create(model);
        },
        onSettled: (response) => {
            if (response && response.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['ProductService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useGetAllProducts = (params?: ProductFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['ProductService.getAll', params],
        queryFn: async () => {
            return await unitOfService.ProductService.getAll(params);
        },
        enabled,
    });
};

const useGetProductById = (id: number | string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['ProductService.getById', id],
        queryFn: async () => {
            return await unitOfService.ProductService.getById(id);
        },
        enabled: enabled && !!id,
    });
};

type UpdateProductArgs = { id: number | string; model: UpdateProductModel };

const useUpdateProduct = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, model }: UpdateProductArgs) => {
            return unitOfService.ProductService.update(id, model);
        },
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['ProductService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};


const useDeleteProduct = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();
    const mutationFn = async (id: number) => {
        return unitOfService.ProductService.delete(id);
    };

    return useMutation({
        mutationFn,
        onSettled: (response) => {
            if (response && response.status === 204) {
                queryClient.invalidateQueries({
                    queryKey: ['ProductService.getAll'],
                });
            }
        },
        onError: (error) => {
            return error;
        },
    });
};

const useGetLowStockProducts = (params?: ProductFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['ProductService.getLowStock', params],
        queryFn: async () => {
            return await unitOfService.ProductService.getLowStock(params);
        },
        enabled,
    });
};



const useGetStockHistory = (id: number | string, params?: { page?: number, recordPerPage?: number }, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['ProductService.getStockHistory', id, params],
        queryFn: async () => {
            return await unitOfService.ProductService.getStockHistory(id, params);
        },
        enabled: enabled && !!id,
    });
};

export {
    useCreateProduct,
    useGetAllProducts,
    useGetProductById,
    useUpdateProduct,
    useGetLowStockProducts,
    useDeleteProduct,
    useGetStockHistory,
};
