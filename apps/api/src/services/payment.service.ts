import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";

import { IPaymentService } from "./interfaces/Ipayment.service";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import ClientError from "../exceptions/client-error";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { CreatePaymentDto, PaymentDto, PaymentMethodEnum, PaymentStatusEnum, UpdatePaymentDto } from '@pms/types';
import { IAccountingPostingService } from "./interfaces/Iaccounting-posting.service";

@injectable()
export class PaymentService implements IPaymentService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.IAccountingPostingService) private accountingPosting: IAccountingPostingService
  ) {}

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

  async create(data: CreatePaymentDto, storeCode: string, userId: string): Promise<PaymentDto> {
    // The store always comes from the parent order, never from the body. Money that belongs
    // to no order is not raised here - it gets its own voucher path.
    if (data.orderId == null) throw new ClientError('A payment raised here must name the order it settles');
    const order = await this.unitOfWork.Order.findById(data.orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.storeCode !== storeCode) throw new ForbiddenError("This order belongs to another store");

    return this.unitOfWork.transaction(async (transactionClient) => {
      const paymentData = await this.unitOfWork.Payment.create({ ...data, storeCode: order.storeCode }, transactionClient);
      await this.accountingPosting.postReceipt(paymentData.id, order.storeCode, userId, transactionClient);
      return paymentData;
    });
  }

  // A udhari settled later arrives here as a status change, which is the moment the money
  // actually moves, so the receipt is posted on update as well as on create.
  async update(id: number, data: UpdatePaymentDto, storeCode: string, userId: string): Promise<PaymentDto> {
    const existing = await this.findInStore(id, storeCode);

    // PAY_LATER names an intention, not a route money travelled by, so it cannot also be the
    // method something was paid *with*. Refusing here keeps a settled udhari from looking
    // paid while the books still show the customer owing - the receipt has no account to
    // debit, so it would silently never post.
    const resultingStatus = data.status ?? existing.status;
    const resultingMethod = data.method ?? existing.method;
    if (resultingStatus === PaymentStatusEnum.Paid && resultingMethod === PaymentMethodEnum.PayLater) {
      throw new ClientError('Record how this was actually paid (cash, UPI, card or bank transfer) before marking it paid');
    }

    // Once a receipt has reached the journal, its amount and route are history. Editing them
    // here would leave the voucher stating the old figure - posting is idempotent, so nothing
    // would correct it and cash would silently disagree with the books for good. The amount is
    // changed by reversing the voucher and recording the real one.
    const amountOrRouteChanged =
      (data.amount !== undefined && data.amount !== existing.amount) || (data.method !== undefined && data.method !== existing.method);
    if (amountOrRouteChanged) {
      const posted = await this.unitOfWork.JournalEntry.findBySource('payment', id, storeCode);
      if (posted) {
        throw new ClientError(`This payment is already posted as ${posted.voucherNumber}. Reverse that voucher before changing the amount or method.`);
      }
    }

    return this.unitOfWork.transaction(async (transactionClient) => {
      const paymentData = await this.unitOfWork.Payment.update(id, data, transactionClient);
      await this.accountingPosting.postReceipt(id, storeCode, userId, transactionClient);
      return paymentData;
    });
  }

  async delete(id: number, storeCode: string): Promise<PaymentDto> {
    await this.findInStore(id, storeCode);
    return this.unitOfWork.Payment.delete(id);
  }
}
