import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateStoreModel, UpdateStoreModel } from '@/models/store.model';
import { StoreFilterParams } from '@/params/store.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateStore = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (model: CreateStoreModel) => {
            return unitOfService.StoreService.create(model);
        },
        onSettled: (response) => {
            if (response && response.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['StoreService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useGetAllStores = (params?: StoreFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StoreService.getAll', params],
        queryFn: async () => {
            return await unitOfService.StoreService.getAll(params);
        },
        enabled,
    });
};

const useGetStoreById = (id: number | string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StoreService.getById', id],
        queryFn: async () => {
            return await unitOfService.StoreService.getById(id);
        },
        enabled: enabled && !!id,
    });
};

type UpdateStoreArgs = { id: number | string; model: UpdateStoreModel };

const useUpdateStore = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, model }: UpdateStoreArgs) => {
            return unitOfService.StoreService.update(id, model);
        },
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['StoreService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useDeleteStore = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();
    const mutationFn = async (id: number) => {
        return unitOfService.StoreService.delete(id);
    };

    return useMutation({
        mutationFn,
        onSettled: (response) => {
            if (response && response.status === 204) {
                queryClient.invalidateQueries({
                    queryKey: ['StoreService.getAll'],
                });
            }
        },
        onError: (error) => {
            return error;
        },
    });
};

export {
    useCreateStore,
    useGetAllStores,
    useGetStoreById,
    useUpdateStore,
    useDeleteStore,
};
