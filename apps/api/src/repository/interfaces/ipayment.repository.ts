import { Prisma } from '@prisma/client';
import {
  CreatePaymentDto,
  ListResponseDto,
  OutstandingSummaryDto,
  PaymentDto,
  PaymentFilterParams,
  PaymentVoucherDto,
  UpdatePaymentDto,
} from '@pms/types';

export interface IPaymentRepository {
  findByOrderId(orderId: number): Promise<PaymentDto[]>;
  findById(id: number): Promise<PaymentDto | null>;
  /**
   * Looks a payment up by gateway transaction id. Used to make payment capture
   * idempotent: a replayed gateway callback must not create a second order.
   */
  findByTransactionId(transactionId: string): Promise<PaymentDto | null>;
  create(data: CreatePaymentDto, tx?: Prisma.TransactionClient): Promise<PaymentDto>;
  update(id: number, data: UpdatePaymentDto, tx?: Prisma.TransactionClient): Promise<PaymentDto>;
  delete(id: number): Promise<PaymentDto>;
  findAllVouchers(filters?: PaymentFilterParams): Promise<ListResponseDto<PaymentVoucherDto>>;
  findVoucherById(id: number, storeCode: string): Promise<PaymentVoucherDto | null>;
  outstanding(storeCode: string): Promise<OutstandingSummaryDto>;
}
