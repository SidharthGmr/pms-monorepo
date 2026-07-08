import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { CreatePaymentDto, PaymentDto, UpdatePaymentDto } from "../dtos/payment.dto";
import { IPaymentService } from "./interfaces/Ipayment.service";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import NotFoundError from "../exceptions/not-found-error";

@injectable()
export class PaymentService implements IPaymentService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async getByOrderId(orderId: number): Promise<PaymentDto[]> {
    return this.unitOfWork.Payment.findByOrderId(orderId);
  }

  async getById(id: number): Promise<PaymentDto | null> {
    const payment = await this.unitOfWork.Payment.findById(id);
    if (!payment) throw new NotFoundError("Payment not found");
    return payment;
  }

  async create(data: CreatePaymentDto): Promise<PaymentDto> {
    return this.unitOfWork.Payment.create(data);
  }

  async update(id: number, data: UpdatePaymentDto): Promise<PaymentDto> {
    const existing = await this.unitOfWork.Payment.findById(id);
    if (!existing) throw new NotFoundError("Payment not found");
    return this.unitOfWork.Payment.update(id, data);
  }

  async delete(id: number): Promise<PaymentDto> {
    const existing = await this.unitOfWork.Payment.findById(id);
    if (!existing) throw new NotFoundError("Payment not found");
    return this.unitOfWork.Payment.delete(id);
  }
}
