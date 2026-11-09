import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { LedgerAccountFilterParams, LedgerAccountModel, LedgerStatementFilterParams,
  ProfitLossParams,
} from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCreateLedgerAccount = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: LedgerAccountModel) => unitOfService.LedgerAccountService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getTree'] });
      }
    },
    onError: (error) => error,
  });
};

const useGetAllLedgerAccounts = (params?: LedgerAccountFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['LedgerAccountService.getAll', params],
    queryFn: () => unitOfService.LedgerAccountService.getAll(params),
    enabled,
  });
};

const useGetLedgerAccountById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['LedgerAccountService.getById', id],
    queryFn: () => unitOfService.LedgerAccountService.getById(id),
    enabled: enabled && !!id,
  });
};

type UpdateLedgerAccountArgs = { id: number | string; model: LedgerAccountModel };

const useUpdateLedgerAccount = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateLedgerAccountArgs) => unitOfService.LedgerAccountService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getById'] });
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getTree'] });
      }
    },
    onError: (error) => error,
  });
};

const useDeleteLedgerAccount = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.LedgerAccountService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getTree'] });
      }
    },
    onError: (error) => error,
  });
};

const useGetLedgerAccountTree = (enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['LedgerAccountService.getTree'],
    queryFn: () => unitOfService.LedgerAccountService.getTree(),
    enabled,
  });
};

const useSeedLedgerAccounts = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unitOfService.LedgerAccountService.seedDefaults(),
    onSettled: (response) => {
      if (response && response.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getAll'] });
        queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getTree'] });
      }
    },
    onError: (error) => error,
  });
};

const useGetLedgerStatement = (id: number | string, params?: LedgerStatementFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['LedgerAccountService.getStatement', id, params],
    queryFn: () => unitOfService.LedgerAccountService.getStatement(id, params),
    enabled: enabled && !!id,
  });
};

const useGetTrialBalance = (params?: LedgerStatementFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['LedgerAccountService.getTrialBalance', params],
    queryFn: () => unitOfService.LedgerAccountService.getTrialBalance(params),
    enabled,
  });
};

const useGetProfitLoss = (params?: ProfitLossParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['LedgerAccountService.getProfitLoss', params],
    queryFn: () => unitOfService.LedgerAccountService.getProfitLoss(params),
    enabled,
  });
};

export {
  useCreateLedgerAccount,
  useDeleteLedgerAccount,
  useGetAllLedgerAccounts,
  useGetLedgerAccountById,
  useGetLedgerAccountTree,
  useGetLedgerStatement,
  useGetProfitLoss,
  useGetTrialBalance,
  useSeedLedgerAccounts,
  useUpdateLedgerAccount,
};
