import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import ResetPasswordModel from '@/models/ResetPasswordModel';
import { CreateUserModel } from '@/models/user.model';
import { UserListParams } from '@/params/user-list.params';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';


const useGetAllUserList = (p?: UserListParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['UserListService.getAll', p],
    queryFn: async () => {
      return await unitOfService.UserListService.getAll(p);
    },
    enabled: enabled,
  });
};

const useGetUserById = (id: string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['UserListService.getById', id],
    queryFn: async () => {
      if (!id) return null;
      return await unitOfService.UserListService.getById(id);
    },
    enabled: enabled,
  });
};

const useUpdateUser = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const queryClient = useQueryClient();

  const mutationFn = async (args: { id: string; model: any }) => {
    return unitOfService.UserListService.update(args.id, args.model);
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 200 && response.data.data) {
        queryClient.invalidateQueries({
          queryKey: ['UserListService.getAll'],
        });
      }
    },
    onError: (error) => {
      return error;
    },
  });
};

const useDeleteUserById = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();
  const mutationFn = async (id: string) => {
    return unitOfService.UserListService.delete(id);
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 204) {
        queryClient.invalidateQueries({
          queryKey: ['UserListService.getAll'],
        });
      }
    },
    onError: (error) => {
      return error;
    },
  });
};

const useVerifyOtp = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();
  const mutationFn = async (otp: number) => {
    return unitOfService.UserListService.getOtp(otp);
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 204) {
        queryClient.invalidateQueries({
          queryKey: ['UserListService.getOtp'],
        });
      }
    },
    onError: (error) => {
      return error;
    },
  });
};

const useSendOtp = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: async () => {
      return await unitOfService.UserListService.sendOtp();
    },
  });
};


const useResetPassword = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();
  const mutationFn = async (model: ResetPasswordModel) => {
    return unitOfService.UserListService.resetPassword(model);
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 204) {
        queryClient.invalidateQueries({
          queryKey: ['UserListService.resetPassword'],
        });
      }
    },
    onError: (error) => {
      return error;
    },
  });
};

const useCreateUserByAdmin = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const mutationFn = async (model: CreateUserModel) => {
    console.log(model);
    return await unitOfService.UserListService.createUser(model);
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 200 && response.data) {
        // handle success
      }
    },
    onError: (error) => {
      return error;
    },
  });
};

// const useResetPassword = () => {
//   const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

//   return useMutation({
//     mutationFn: async (model: ResetPasswordModel) => {
//       return await unitOfService.UserListService.resetPassword(model);
//     },
//   });
// };

export { useCreateUserByAdmin, useDeleteUserById, useGetAllUserList, useGetUserById, useResetPassword, useSendOtp, useUpdateUser, useVerifyOtp };

