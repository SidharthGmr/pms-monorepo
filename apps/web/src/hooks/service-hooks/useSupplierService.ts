import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateSupplierModel } from '@/models/supplier.model';
import { SupplierFilterParams } from '@/params/supplier.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateSupplier = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (model: CreateSupplierModel) => unitOfService.SupplierService.create(model),
        onSettled: (response) => {
            if (response && response.status === 201) {
                queryClient.invalidateQueries({ queryKey: ['SupplierService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useGetAllSuppliers = (params?: SupplierFilterParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['SupplierService.getAll', params],
        queryFn: () => unitOfService.SupplierService.getAll(params),
        enabled,
    });
};

const useGetSupplierById = (id: number | string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['SupplierService.getById', id],
        queryFn: () => unitOfService.SupplierService.getById(id),
        enabled: enabled && !!id,
    });
};

type UpdateSupplierArgs = { id: number | string; model: CreateSupplierModel };

const useUpdateSupplier = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, model }: UpdateSupplierArgs) => unitOfService.SupplierService.update(id, model),
        onSettled: (response) => {
            if (response && response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['SupplierService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

const useDeleteSupplier = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number | string) => unitOfService.SupplierService.delete(id),
        onSettled: (response) => {
            if (response && response.status === 204) {
                queryClient.invalidateQueries({ queryKey: ['SupplierService.getAll'] });
            }
        },
        onError: (error) => error,
    });
};

export {
    useCreateSupplier,
    useGetAllSuppliers,
    useGetSupplierById,
    useUpdateSupplier,
    useDeleteSupplier,
};
