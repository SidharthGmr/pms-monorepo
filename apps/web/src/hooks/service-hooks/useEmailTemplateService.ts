'use client';

import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { PreviewEmailTemplateModel, UpdateEmailTemplateModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const EMAIL_TEMPLATES_QUERY_KEY = ['EmailTemplateService.getAll'];

const useGetAllEmailTemplates = (enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: EMAIL_TEMPLATES_QUERY_KEY,
    queryFn: () => unitOfService.EmailTemplateService.getAll(),
    enabled,
  });
};

const useGetEmailTemplateByKey = (key: string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['EmailTemplateService.getByKey', key],
    queryFn: () => unitOfService.EmailTemplateService.getByKey(key),
    enabled: enabled && !!key,
  });
};

type UpdateEmailTemplateArgs = { key: string; model: UpdateEmailTemplateModel };

const useUpdateEmailTemplate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, model }: UpdateEmailTemplateArgs) => unitOfService.EmailTemplateService.update(key, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATES_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['EmailTemplateService.getByKey'] });
      }
    },
    onError: (error) => error,
  });
};

const useResetEmailTemplate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => unitOfService.EmailTemplateService.reset(key),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATES_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['EmailTemplateService.getByKey'] });
      }
    },
    onError: (error) => error,
  });
};

type EmailTemplateBodyArgs = { key: string; model: PreviewEmailTemplateModel };

// Preview and test send act on the editor's current, possibly unsaved draft, so they are
// mutations rather than queries - there is no server state to key them by.
const usePreviewEmailTemplate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: ({ key, model }: EmailTemplateBodyArgs) => unitOfService.EmailTemplateService.preview(key, model),
    onError: (error) => error,
  });
};

const useSendTestEmailTemplate = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: ({ key, model }: EmailTemplateBodyArgs) => unitOfService.EmailTemplateService.sendTest(key, model),
    onError: (error) => error,
  });
};

export {
  useGetAllEmailTemplates,
  useGetEmailTemplateByKey,
  usePreviewEmailTemplate,
  useResetEmailTemplate,
  useSendTestEmailTemplate,
  useUpdateEmailTemplate,
};
