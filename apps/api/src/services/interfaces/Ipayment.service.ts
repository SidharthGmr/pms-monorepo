import { CreatePaymentDto, PaymentDto, UpdatePaymentDto } from "../../dtos/payment.dto";

export interface IPaymentService {
  getByOrderId(orderId: number): Promise<PaymentDto[]>;
  getById(id: number): Promise<PaymentDto | null>;
  create(data: CreatePaymentDto): Promise<PaymentDto>;
  update(id: number, data: UpdatePaymentDto): Promise<PaymentDto>;
  delete(id: number): Promise<PaymentDto>;
}
