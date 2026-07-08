import prisma from "../config/prisma";
import { CreatePaymentDto, PaymentDto, UpdatePaymentDto } from "../dtos/payment.dto";
import { IPaymentRepository } from "./interfaces/ipayment.repository";

export class PaymentRepository implements IPaymentRepository {
  async findByOrderId(orderId: number): Promise<PaymentDto[]> {
    return prisma.payment.findMany({ where: { orderId } });
  }

  async findById(id: number): Promise<PaymentDto | null> {
    return prisma.payment.findUnique({ where: { id } });
  }

  async create(data: CreatePaymentDto): Promise<PaymentDto> {
    return prisma.payment.create({ data });
  }

  async update(id: number, data: UpdatePaymentDto): Promise<PaymentDto> {
    return prisma.payment.update({ where: { id }, data });
  }

  async delete(id: number): Promise<PaymentDto> {
    return prisma.payment.delete({ where: { id } });
  }
}
