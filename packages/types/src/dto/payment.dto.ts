import { PaymentMethod } from '../enum/payment-method.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

export interface PaymentDto {
  id: number;
  orderId: number;
  storeCode: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string | null;
  paymentDate: Date | string;
  remarks?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreatePaymentDto {
  orderId: number;
  storeCode: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  transactionId?: string | null;
  paymentDate?: Date;
  remarks?: string | null;
}

export interface UpdatePaymentDto {
  amount?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  transactionId?: string | null;
  remarks?: string | null;
}
