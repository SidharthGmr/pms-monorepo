import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ExpenseFilterParams, ExpenseModel, ExpenseStatusModel, ExpenseSummaryParams } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// An approved or paid expense writes to the journal, so the books are invalidated with it.
const invalidateAfterExpense = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['ExpenseService.getAll'] });
  queryClient.invalidateQueries({ queryKey: ['ExpenseService.getById'] });
  queryClient.invalidateQueries({ queryKey: ['ExpenseService.getSummary'] });
  queryClient.invalidateQueries({ queryKey: ['PaymentService.getOutstanding'] });
  queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getAll'] });
  queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getDaySummary'] });
  queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getStatement'] });
  queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getTrialBalance'] });
};

const useCreateExpense = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: ExpenseModel) => unitOfService.ExpenseService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) invalidateAfterExpense(queryClient);
    },
    onError: (error) => error,
  });
};

const useGetAllExpenses = (params?: ExpenseFilterParams) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['ExpenseService.getAll', params],
    queryFn: () => unitOfService.ExpenseService.getAll(params),
  });
};

const useGetExpenseById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['ExpenseService.getById', id],
    queryFn: () => unitOfService.ExpenseService.getById(id),
    enabled: enabled && !!id,
  });
};

type UpdateExpenseArgs = { id: number | string; model: ExpenseModel };

const useUpdateExpense = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateExpenseArgs) => unitOfService.ExpenseService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) invalidateAfterExpense(queryClient);
    },
    onError: (error) => error,
  });
};

const useDeleteExpense = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unitOfService.ExpenseService.delete(id),
    onSettled: (response) => {
      if (response && response.status === 200) invalidateAfterExpense(queryClient);
    },
    onError: (error) => error,
  });
};

type UpdateExpenseStatusArgs = { id: number | string; model: ExpenseStatusModel };

const useUpdateExpenseStatus = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdateExpenseStatusArgs) => unitOfService.ExpenseService.updateStatus(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) invalidateAfterExpense(queryClient);
    },
    onError: (error) => error,
  });
};

const useGetExpenseSummary = (params?: ExpenseSummaryParams) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['ExpenseService.getSummary', params],
    queryFn: () => unitOfService.ExpenseService.getSummary(params),
  });
};

const useRunRecurringExpenses = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unitOfService.ExpenseService.runRecurring(),
    onSettled: (response) => {
      if (response && response.status === 201) invalidateAfterExpense(queryClient);
    },
    onError: (error) => error,
  });
};

export {
  useCreateExpense,
  useGetAllExpenses,
  useGetExpenseById,
  useUpdateExpense,
  useDeleteExpense,
  useUpdateExpenseStatus,
  useGetExpenseSummary,
  useRunRecurringExpenses,
};
