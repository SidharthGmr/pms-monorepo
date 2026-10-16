import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CatalogFilterParams } from '@pms/types';
import { useQuery } from '@tanstack/react-query';

const useGetCatalogProducts = (params?: CatalogFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['CatalogService.getAll', params],
    queryFn: () => unitOfService.CatalogService.getAll(params),
    enabled,
  });
};

const useGetCatalogProduct = (slug: string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['CatalogService.getBySlug', slug],
    queryFn: () => unitOfService.CatalogService.getBySlug(slug),
    enabled: enabled && !!slug,
  });
};

const useGetCatalogFacets = (storeCode?: string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['CatalogService.getFacets', storeCode],
    queryFn: () => unitOfService.CatalogService.getFacets(storeCode),
    enabled,
  });
};

export { useGetCatalogFacets, useGetCatalogProduct, useGetCatalogProducts };
