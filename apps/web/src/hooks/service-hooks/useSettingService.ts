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

/**
 * Settings read on demand rather than on mount - the invoice download needs the logo only at
 * the moment the button is pressed. fetchQuery shares the cache with useGetSettings, so a
 * second download reuses what the first one fetched.
 */
const useFetchSettings = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return () =>
    queryClient.fetchQuery({
      queryKey: SETTINGS_QUERY_KEY,
      queryFn: () => unitOfService.SettingService.get(),
    });
};

/** Uploads the branding logo to the PUBLIC blob store; the private useBlobUpload cannot serve emails. */
const useUploadLogo = () => {
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

export { useFetchSettings, useGetSettings, useUpdateSettings, useUploadLogo };
