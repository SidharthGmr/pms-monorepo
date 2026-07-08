import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateStaffModel, UpdateStaffModel } from '@/models/staff.model';
import { StaffFilterParams } from '@/params/staff.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateStaff = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (model: CreateStaffModel) => {
            return unitOfService.StaffService.create(model);
        },
        onSettled: (response) => {
            if (response && response.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['StaffService.getAll'] });
                queryClient.invalidateQueries({ queryKey: ['StaffService.getCount'] });
            }
        },
        onError: (error) => error,
    });
};

const useGetAllStaff = (params?: StaffFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StaffService.getAll', params],
        queryFn: async () => {
            return await unitOfService.StaffService.getAll(params);
        },
        enabled,
    });
};

const useGetStaffCount = (enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StaffService.getCount'],
        queryFn: async () => {
            return await unitOfService.StaffService.getCount();
        },
        enabled,
    });
};

const useGetStaffById = (id: number | string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StaffService.getById', id],
        queryFn: async () => {
            return await unitOfService.StaffService.getById(id);
        },
        enabled: enabled && !!id,
    });
};

const useGetStaffByStoreId = (storeId: number, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StaffService.getByStoreId', storeId],
        queryFn: async () => {
            return await unitOfService.StaffService.getByStoreId(storeId);
        },
        enabled: enabled && !!storeId,
    });
};

const useGetStaffByUserId = (userId: number, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StaffService.getByUserId', userId],
        queryFn: async () => {
            return await unitOfService.StaffService.getByUserId(userId);
        },
        enabled: enabled && !!userId,
    });
};

type UpdateStaffArgs = { id: number | string; model: UpdateStaffModel };

const useUpdateStaff = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, model }: UpdateStaffArgs) => {
            return unitOfService.StaffService.update(id, model);
        },
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['StaffService.getAll'] });
                queryClient.invalidateQueries({ queryKey: ['StaffService.getCount'] });
            }
        },
        onError: (error) => error,
    });
};

const useDeleteStaff = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    const mutationFn = async (id: number) => {
        return unitOfService.StaffService.delete(id);
    };

    return useMutation({
        mutationFn,
        onSettled: (response) => {
            if (response && response.status === 204) {
                queryClient.invalidateQueries({
                    queryKey: ['StaffService.getAll'],
                });
                queryClient.invalidateQueries({
                    queryKey: ['StaffService.getCount'],
                });
            }
        },
        onError: (error) => {
            return error;
        },
    });
};

export {
    useCreateStaff,
    useGetAllStaff,
    useGetStaffCount,
    useGetStaffById,
    useGetStaffByStoreId,
    useGetStaffByUserId,
    useUpdateStaff,
    useDeleteStaff,
};
