import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';


import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateStoreModel, UpdateMyStoreModel, UpdateStoreModel, StoreFilterParams } from '@pms/types';

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
                // Branding (siteName, storeLogo) may have changed - refresh the own-store read too.
                queryClient.invalidateQueries({ queryKey: MY_STORE_QUERY_KEY });
            }
        },
        onError: (error) => error,
    });
};

const MY_STORE_QUERY_KEY = ['StoreService.getMyStore'];

/** The logged-in user's own store - the home of branding (siteName, storeLogo). */
const useGetMyStore = (enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: MY_STORE_QUERY_KEY,
        queryFn: async () => {
            return await unitOfService.StoreService.getMyStore();
        },
        enabled,
    });
};

/**
 * My-store read on demand rather than on mount - the invoice download needs the logo only at
 * the moment the button is pressed. fetchQuery shares the cache with useGetMyStore.
 */
const useFetchMyStore = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return () =>
        queryClient.fetchQuery({
            queryKey: MY_STORE_QUERY_KEY,
            queryFn: async () => {
                return await unitOfService.StoreService.getMyStore();
            },
        });
};

/** Admin self-service: saves the contact/branding slice of the caller's own store. */
const useUpdateMyStore = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (model: UpdateMyStoreModel) => {
            return unitOfService.StoreService.updateMyStore(model);
        },
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: MY_STORE_QUERY_KEY });
                queryClient.invalidateQueries({ queryKey: ['StoreService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

/** Uploads the store logo to the PUBLIC branding blob namespace, so emails and PDFs can load it. */
const useUploadStoreLogo = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useMutation({
        mutationFn: async ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) => {
            const response = await unitOfService.MediaService.uploadLogo(file, { onProgress });
            if (!response.success || !response.data?.url) throw new Error(response.message || 'Failed to upload logo');
            return response.data;
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
    useGetMyStore,
    useFetchMyStore,
    useUpdateMyStore,
    useUploadStoreLogo,
    useUpdateStore,
    useDeleteStore,
};
