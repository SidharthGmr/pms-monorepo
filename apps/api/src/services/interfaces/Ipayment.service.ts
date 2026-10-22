import { CreatePaymentDto, PaymentDto, UpdatePaymentDto } from '@pms/types';

export interface IPaymentService {
  getByOrderId(orderId: number, storeCode: string): Promise<PaymentDto[]>;
  getById(id: number, storeCode: string): Promise<PaymentDto | null>;
  create(data: CreatePaymentDto, storeCode: string): Promise<PaymentDto>;
  update(id: number, data: UpdatePaymentDto, storeCode: string): Promise<PaymentDto>;
  delete(id: number, storeCode: string): Promise<PaymentDto>;
}
