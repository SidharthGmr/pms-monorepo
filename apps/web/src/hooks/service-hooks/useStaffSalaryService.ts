import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateStaffSalaryModel, UpdateStaffSalaryModel } from '@/models/staff-salary.model';
import { StaffSalaryFilterParams } from '@/params/staff-salary.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateStaffSalary = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (model: CreateStaffSalaryModel) => {
            return unitOfService.StaffSalaryService.create(model);
        },
        onSettled: (response) => {
            if (response && response.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['StaffSalaryService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useGetAllStaffSalaries = (params?: StaffSalaryFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StaffSalaryService.getAll', params],
        queryFn: async () => {
            return await unitOfService.StaffSalaryService.getAll(params);
        },
        enabled,
    });
};

const useGetStaffSalaryById = (id: number | string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StaffSalaryService.getById', id],
        queryFn: async () => {
            return await unitOfService.StaffSalaryService.getById(id);
        },
        enabled: enabled && !!id,
    });
};

const useGetSalariesByStaffId = (staffId: number, params?: StaffSalaryFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['StaffSalaryService.getByStaffId', staffId, params],
        queryFn: async () => {
            return await unitOfService.StaffSalaryService.getByStaffId(staffId, params);
        },
        enabled: enabled && !!staffId,
    });
};

type UpdateStaffSalaryArgs = { id: number | string; model: UpdateStaffSalaryModel };

const useUpdateStaffSalary = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, model }: UpdateStaffSalaryArgs) => {
            return unitOfService.StaffSalaryService.update(id, model);
        },
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['StaffSalaryService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useDeleteStaffSalary = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    const mutationFn = async (id: number) => {
        return unitOfService.StaffSalaryService.delete(id);
    };

    return useMutation({
        mutationFn,
        onSettled: (response) => {
            if (response && response.status === 204) {
                queryClient.invalidateQueries({
                    queryKey: ['StaffSalaryService.getAll'],
                });
            }
        },
        onError: (error) => {
            return error;
        },
    });
};

export {
    useCreateStaffSalary,
    useGetAllStaffSalaries,
    useGetStaffSalaryById,
    useGetSalariesByStaffId,
    useUpdateStaffSalary,
    useDeleteStaffSalary,
};
