import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import LoginModel from '@/models/LoginModel';
import { CreateUserModel, UpdateUserModel } from '@/models/user.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery } from '@tanstack/react-query';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const useLogin = () => {
  const mutationFn = async (model: LoginModel) => {
    return await unitOfService.AccountService.login(model);
  };

  return useMutation({
    mutationFn: mutationFn,
    onSettled: (response: { status?: number; data?: any } | undefined) => {
      if (response && response.status === 200 && response.data) {
        //invalidate query here if required
      }
    },
  });
};


const useDbLogout = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const mutationFn = async (token: string) => {
    return unitOfService.AccountService.logout(token);
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 200) {
      }
    },
    onError: (error) => {
      return error;
    },
  });
};


const useLogoutAllSession = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const mutationFn = async () => {
    return unitOfService.AccountService.logoutAllSession();
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 200) {
      }
    },
    onError: (error) => {
      return error;
    },
  });
};

const useRefreshToken = (token: string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['AccountService.AccountService', token],
    queryFn: async () => {
      if (!token) return null;
      return await unitOfService.AccountService.getRefreshToken(token);
    },
    enabled: enabled,
  });
};

const useCreateUser = () => {
  const mutationFn = async (model: CreateUserModel) => {
    return await unitOfService.AccountService.createUser(model);
  };

  return useMutation({

    onSettled: (response: { status?: number; data?: any } | undefined) => {
      if (response && response.status === 200 && response.data) {
        // handle success
      }
    },
    onError: (error) => {
      return error;
    },
  });
};

const useUpdateProfile = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const mutationFn = async (model: UpdateUserModel) => {
    return await unitOfService.AccountService.updateProfile(model);
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      // You can invalidate queries or update session manually in the component
    },
    onError: (error) => {
      return error;
    },
  });
};

export { useCreateUser, useDbLogout, useLogin, useLogoutAllSession, useRefreshToken, useUpdateProfile };

