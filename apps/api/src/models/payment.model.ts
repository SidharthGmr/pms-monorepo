export interface CreatePaymentModel {
  orderId: number;
  amount: number;
  method: string;
  status?: string;
  transactionId?: string;
  paymentDate?: string;
  remarks?: string;
}

export interface UpdatePaymentModel {
  amount?: number;
  method?: string;
  status?: string;
  transactionId?: string;
  remarks?: string;
}
