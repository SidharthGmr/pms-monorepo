import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { AccountingBackfillModel, JournalEntryFilterParams, JournalEntryModel, ReverseJournalEntryModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const invalidateJournal = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getAll'] });
  queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getDaySummary'] });
  queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getById'] });
};

const useCreateJournalEntry = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: JournalEntryModel) => unitOfService.JournalEntryService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) invalidateJournal(queryClient);
    },
    onError: (error) => error,
  });
};

const useGetAllJournalEntries = (params?: JournalEntryFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['JournalEntryService.getAll', params],
    queryFn: () => unitOfService.JournalEntryService.getAll(params),
    enabled,
  });
};

const useGetJournalEntryById = (id: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['JournalEntryService.getById', id],
    queryFn: () => unitOfService.JournalEntryService.getById(id),
    enabled: enabled && !!id,
  });
};

// Deliberately keyed on the same params as the listing: the totals describe the rows on screen,
// so they must refetch together rather than lagging a filter change.
const useGetDayBookSummary = (params?: JournalEntryFilterParams, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['JournalEntryService.getDaySummary', params],
    queryFn: () => unitOfService.JournalEntryService.getDaySummary(params),
    enabled,
  });
};

type ReverseJournalEntryArgs = { id: number | string; model: ReverseJournalEntryModel };

const useReverseJournalEntry = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: ReverseJournalEntryArgs) => unitOfService.JournalEntryService.reverse(id, model),
    onSettled: (response) => {
      if (response && response.status === 201) invalidateJournal(queryClient);
    },
    onError: (error) => error,
  });
};

const useBackfillJournal = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: AccountingBackfillModel) => unitOfService.JournalEntryService.backfill(model),
    onSettled: (response) => {
      if (response && response.status === 200) invalidateJournal(queryClient);
    },
    onError: (error) => error,
  });
};

export { useBackfillJournal, useCreateJournalEntry, useGetAllJournalEntries, useGetDayBookSummary, useGetJournalEntryById, useReverseJournalEntry };
