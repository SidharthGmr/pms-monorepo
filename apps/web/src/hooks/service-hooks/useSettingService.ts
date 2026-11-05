'use client';

import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { UpdateSettingsModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const SETTINGS_QUERY_KEY = ['SettingService.get'];

const useGetSettings = (enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => unitOfService.SettingService.get(),
    enabled,
  });
};

const useUpdateSettings = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: UpdateSettingsModel) => unitOfService.SettingService.update(model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      }
    },
    onError: (error) => error,
  });
};

export { useGetSettings, useUpdateSettings };
