import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateBrandNameModel } from '@/models/brand-name.model';
import { BrandNameFilterParams } from '@/params/brand-name.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateBrandName = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (model: CreateBrandNameModel) => unitOfService.BrandNameService.create(model),
        onSettled: (response) => {
            if (response && response.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['BrandNameService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useGetAllBrandNames = (params?: BrandNameFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['BrandNameService.getAll', params],
        queryFn: () => unitOfService.BrandNameService.getAll(params),
        enabled,
    });
};

const useGetBrandNameById = (id: number | string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['BrandNameService.getById', id],
        queryFn: () => unitOfService.BrandNameService.getById(id),
        enabled: enabled && !!id,
    });
};

type UpdateBrandNameArgs = { id: number | string; model: CreateBrandNameModel };

const useUpdateBrandName = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, model }: UpdateBrandNameArgs) => unitOfService.BrandNameService.update(id, model),
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['BrandNameService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useDeleteBrandName = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number | string) => unitOfService.BrandNameService.delete(id),
        onSettled: (response) => {
            if (response && response.status === 204) {
                queryClient.invalidateQueries({ queryKey: ['BrandNameService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

export {
    useCreateBrandName,
    useGetAllBrandNames,
    useGetBrandNameById,
    useUpdateBrandName,
    useDeleteBrandName,
};
