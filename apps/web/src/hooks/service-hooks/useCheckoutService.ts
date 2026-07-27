import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CheckoutAdjustmentsModel, DirectCheckoutModel, VerifyRazorpayPaymentModel } from '@/models/checkout.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const SUMMARY_KEY = 'CheckoutService.getSummary';

const useGetCheckoutSummary = (adjustments?: CheckoutAdjustmentsModel, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: [SUMMARY_KEY, adjustments],
    queryFn: async () => {
      return await unitOfService.CheckoutService.getSummary(adjustments);
    },
    enabled,
  });
};

const useCreateRazorpayOrder = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: async (adjustments?: CheckoutAdjustmentsModel) => {
      return unitOfService.CheckoutService.createRazorpayOrder(adjustments);
    },
    onError: (error) => error,
  });
};

/** Invalidates the cart and orders once a checkout empties the cart. */
const useInvalidateAfterCheckout = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['CartService.getActive'] });
    queryClient.invalidateQueries({ queryKey: [SUMMARY_KEY] });
    queryClient.invalidateQueries({ queryKey: ['OrderService.getAll'] });
  };
};

const useVerifyRazorpayPayment = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const invalidate = useInvalidateAfterCheckout();

  return useMutation({
    mutationFn: async (model: VerifyRazorpayPaymentModel) => {
      return unitOfService.CheckoutService.verifyRazorpayPayment(model);
    },
    onSettled: (response) => {
      if (response && response.status === 201) invalidate();
    },
    onError: (error) => error,
  });
};

const useCheckoutDirect = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const invalidate = useInvalidateAfterCheckout();

  return useMutation({
    mutationFn: async (model: DirectCheckoutModel) => {
      return unitOfService.CheckoutService.checkoutDirect(model);
    },
    onSettled: (response) => {
      if (response && response.status === 201) invalidate();
    },
    onError: (error) => error,
  });
};

export { useGetCheckoutSummary, useCreateRazorpayOrder, useVerifyRazorpayPayment, useCheckoutDirect };
