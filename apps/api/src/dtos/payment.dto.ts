import { PaymentMethod, PaymentStatus } from "@prisma/client";

export interface PaymentDto {
  id: number;
  orderId: number;
  storeCode: string
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string | null;
  paymentDate: Date;
  remarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDto {
  orderId: number;
  storeCode: string
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
