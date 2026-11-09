import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CreatePaymentModel, UpdatePaymentModel } from '@pms/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// A payment changes what the books say, so the journal reads are invalidated with it.
const invalidateAfterPayment = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['PaymentService.getByOrderId'] });
  queryClient.invalidateQueries({ queryKey: ['OrderService.getAll'] });
  queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getAll'] });
  queryClient.invalidateQueries({ queryKey: ['JournalEntryService.getDaySummary'] });
  queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getStatement'] });
  queryClient.invalidateQueries({ queryKey: ['LedgerAccountService.getTrialBalance'] });
};

const useCreatePayment = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model: CreatePaymentModel) => unitOfService.PaymentService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201) invalidateAfterPayment(queryClient);
    },
    onError: (error) => error,
  });
};

const useGetPaymentsByOrderId = (orderId: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['PaymentService.getByOrderId', orderId],
    queryFn: () => unitOfService.PaymentService.getByOrderId(orderId),
    enabled: enabled && !!orderId,
  });
};

type UpdatePaymentArgs = { id: number | string; model: UpdatePaymentModel };

const useUpdatePayment = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }: UpdatePaymentArgs) => unitOfService.PaymentService.update(id, model),
    onSettled: (response) => {
      if (response && response.status === 200) invalidateAfterPayment(queryClient);
    },
    onError: (error) => error,
  });
};

export { useCreatePayment, useGetPaymentsByOrderId, useUpdatePayment };
