import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateCategoryModel, UpdateCategoryModel } from '@/models/category.model';
import { CategoryFilterParams } from '@/params/category.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateCategory = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (model: CreateCategoryModel) => unitOfService.CategoryService.create(model),
        onSettled: (response) => {
            if (response && response.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['CategoryService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useGetAllCategories = (params?: CategoryFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['CategoryService.getAll',params],
        queryFn: () => unitOfService.CategoryService.getAll(params),
        enabled,
    });
};

const useGetCategoryById = (id: number | string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['CategoryService.getById', id],
        queryFn: () => unitOfService.CategoryService.getById(id),
        enabled: enabled && !!id,
    });
};

type UpdateCategoryArgs = { id: number | string; model: UpdateCategoryModel };

const useUpdateCategory = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, model }: UpdateCategoryArgs) => unitOfService.CategoryService.update(id, model),
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['CategoryService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useDeleteCategory = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number | string) => unitOfService.CategoryService.delete(id),
        onSettled: (response) => {
            if (response && response.status === 204) {
                queryClient.invalidateQueries({ queryKey: ['CategoryService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

export {
    useCreateCategory,
    useGetAllCategories,
    useGetCategoryById,
    useUpdateCategory,
    useDeleteCategory,
};
