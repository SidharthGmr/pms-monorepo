import { CreatePaymentDto, PaymentDto, UpdatePaymentDto } from "../../dtos/payment.dto";

export interface IPaymentRepository {
  findByOrderId(orderId: number): Promise<PaymentDto[]>;
  findById(id: number): Promise<PaymentDto | null>;
  /**
   * Looks a payment up by gateway transaction id. Used to make payment capture
   * idempotent: a replayed gateway callback must not create a second order.
   */
  findByTransactionId(transactionId: string): Promise<PaymentDto | null>;
  create(data: CreatePaymentDto): Promise<PaymentDto>;
  update(id: number, data: UpdatePaymentDto): Promise<PaymentDto>;
  delete(id: number): Promise<PaymentDto>;
}
