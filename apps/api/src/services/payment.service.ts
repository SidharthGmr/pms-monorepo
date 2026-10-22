import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";

import { IPaymentService } from "./interfaces/Ipayment.service";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { CreatePaymentDto, PaymentDto, UpdatePaymentDto } from '@pms/types';

@injectable()
export class PaymentService implements IPaymentService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  /** The payment the id names, verified to belong to the caller's store. */
  private async findInStore(id: number, storeCode: string): Promise<PaymentDto> {
    const payment = await this.unitOfWork.Payment.findById(id);
    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.storeCode !== storeCode) throw new ForbiddenError("This payment belongs to another store");
    return payment;
  }

  async getByOrderId(orderId: number, storeCode: string): Promise<PaymentDto[]> {
    const order = await this.unitOfWork.Order.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.storeCode !== storeCode) throw new ForbiddenError("This order belongs to another store");
    return this.unitOfWork.Payment.findByOrderId(orderId);
  }

  async getById(id: number, storeCode: string): Promise<PaymentDto | null> {
    return this.findInStore(id, storeCode);
  }

  async create(data: CreatePaymentDto, storeCode: string): Promise<PaymentDto> {
    // The store always comes from the parent order, never from the body.
    const order = await this.unitOfWork.Order.findById(data.orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.storeCode !== storeCode) throw new ForbiddenError("This order belongs to another store");
    return this.unitOfWork.Payment.create({ ...data, storeCode: order.storeCode });
  }

  async update(id: number, data: UpdatePaymentDto, storeCode: string): Promise<PaymentDto> {
    await this.findInStore(id, storeCode);
    return this.unitOfWork.Payment.update(id, data);
  }

  async delete(id: number, storeCode: string): Promise<PaymentDto> {
    await this.findInStore(id, storeCode);
    return this.unitOfWork.Payment.delete(id);
  }
}
