import { PaymentMethod } from '../enum/payment-method.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

export interface CreatePaymentModel {
  orderId: number;
  amount: number;
  method: PaymentMethod | string;
  status?: PaymentStatus | string;
  transactionId?: string;
  paymentDate?: string;
  remarks?: string;
}

export interface UpdatePaymentModel {
  amount?: number;
  method?: PaymentMethod | string;
  status?: PaymentStatus | string;
  transactionId?: string;
  remarks?: string;
}
