import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmailModel } from '@/models/email.model';
import { UserListParams } from '@/params/user-list.params';

const useSendEmail = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    const mutationFn = async (model: EmailModel) => {
        return unitOfService.EmailService.sendEmail(model);
    };

    return useMutation({
        mutationFn,
        onSettled: (response) => {
            if (response && response.status === 201) {
            }
        },
        onError: (error) => error,
    });
};



const useGetAllEmailList = (p?: UserListParams, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['EmailService.getAll', p],
        queryFn: async () => {
            return await unitOfService.EmailService.getAll(p);
        },
        enabled: enabled,
    });
};
const useGetEmailsById = (id: string, enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['EmailService.getById', id],
        queryFn: async () => {
            if (!id) return null;
            return await unitOfService.EmailService.getById(+id);
        },
        enabled: enabled,
    });
};

const useDeleteEmailById = () => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const queryClient = useQueryClient();
    const mutationFn = async (id: number) => {
        return unitOfService.EmailService.delete(id);
    };

    return useMutation({
        mutationFn,
        onSettled: (response) => {
            if (response && response.status === 204) {
                queryClient.invalidateQueries({
                    queryKey: ['EmailService.getAll'],
                });
            }
        },
        onError: (error) => {
            return error;
        },
    });
};



export { useSendEmail, useGetAllEmailList, useGetEmailsById, useDeleteEmailById };
