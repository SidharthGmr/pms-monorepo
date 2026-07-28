import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CreateMasterAttributeModel, CreateMasterEntryModel } from '@/models/master-entry.model';
import { MasterAttributeFilterParams, MasterEntryFilterParams } from '@/params/master-entry.params';
import IMasterAttributeService from '@/services/interfaces/IMasterAttributeService';
import IMasterEntryService from '@/services/interfaces/IMasterEntryService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const attributeService = () => container.get<IMasterAttributeService>(TYPES.IMasterAttributeService);
const entryService = () => container.get<IMasterEntryService>(TYPES.IMasterEntryService);

// Groups and values are shown together (and trashing a group trashes its values), so
// any write invalidates both namespaces.
const invalidateMasterData = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['master-attributes'] });
  queryClient.invalidateQueries({ queryKey: ['master-entries'] });
};

export const useGetAllMasterAttributes = (params?: MasterAttributeFilterParams, enabled: boolean = true) =>
  useQuery({
    queryKey: ['master-attributes', params],
    queryFn: () => attributeService().getAll(params),
    enabled,
  });

export const useGetMasterAttributeById = (id: number | string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['master-attributes', id],
    queryFn: () => attributeService().getById(id),
    enabled: !!id && enabled,
  });

export const useGetMasterAttributeByCode = (code: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['master-attributes', 'code', code],
    queryFn: () => attributeService().getByCode(code),
    enabled: !!code && enabled,
  });

export const useCreateMasterAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (model: CreateMasterAttributeModel) => attributeService().create(model),
    onSettled: () => invalidateMasterData(queryClient),
  });
};

export const useUpdateMasterAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }: { id: number | string; model: CreateMasterAttributeModel }) => attributeService().update(id, model),
    onSettled: () => invalidateMasterData(queryClient),
  });
};

export const useDeleteMasterAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => attributeService().delete(id),
    onSettled: () => invalidateMasterData(queryClient),
  });
};

export const useGetAllMasterEntries = (params?: MasterEntryFilterParams, enabled: boolean = true) =>
  useQuery({
    queryKey: ['master-entries', params],
    queryFn: () => entryService().getAll(params),
    enabled,
  });

export const useGetMasterEntryById = (id: number | string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['master-entries', id],
    queryFn: () => entryService().getById(id),
    enabled: !!id && enabled,
  });

/**
 * Values for one attribute code, in display order, unpaginated - the shape a dropdown
 * anywhere in the app wants. Backs `MasterEntrySelect`.
 */
export const useMasterEntriesByCode = (attributeCode: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['master-entries', 'by-code', attributeCode],
    queryFn: () =>
      entryService().getAll({
        attributeCode,
        status: 'Published',
        showAllRecords: true,
        sortBy: 'displayOrder',
        sortDirection: 'ASC',
      }),
    enabled: !!attributeCode && enabled,
  });

export const useCreateMasterEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (model: CreateMasterEntryModel) => entryService().create(model),
    onSettled: () => invalidateMasterData(queryClient),
  });
};

export const useUpdateMasterEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }: { id: number | string; model: CreateMasterEntryModel }) => entryService().update(id, model),
    onSettled: () => invalidateMasterData(queryClient),
  });
};

export const useDeleteMasterEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => entryService().delete(id),
    onSettled: () => invalidateMasterData(queryClient),
  });
};
