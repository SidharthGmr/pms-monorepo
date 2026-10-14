import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CmsPageFilterParams, CreateCmsPageModel, UpdateCmsPageModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useGetAllCmsPages = (params?: CmsPageFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['CmsPageService.getAll', params],
    queryFn: () => unitOfService.CmsPageService.getAll(params),
    enabled,
  });
};

const useGetCmsPageById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['CmsPageService.getById', id],
    queryFn: () => unitOfService.CmsPageService.getById(id),
    enabled: enabled && !!id,
  });
};

const useCreateCmsPage = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: CreateCmsPageModel) => unitOfService.CmsPageService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['CmsPageService.getAll'] });
      }
    },
    onError: (error) => error,
  });
};

type UpdateCmsPageArgs = { id: number | string; model: UpdateCmsPageModel };

const useUpdateCmsPage = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateCmsPageArgs) => unitOfService.CmsPageService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['CmsPageService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['CmsPageService.getById'] });
      }
    },
    onError: (error) => error,
  });
};

const useDeleteCmsPage = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.CmsPageService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['CmsPageService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['CmsPageService.getById'] });
      }
    },
    onError: (error) => error,
  });
};

/** Public storefront: unlock a password-protected page and get its content back. */
const useUnlockCmsPage = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: ({ slug, password }: { slug: string; password: string }) => unitOfService.CmsPageService.unlock(slug, password),
    onError: (error) => error,
  });
};

export { useCreateCmsPage, useDeleteCmsPage, useGetAllCmsPages, useGetCmsPageById, useUnlockCmsPage, useUpdateCmsPage };
