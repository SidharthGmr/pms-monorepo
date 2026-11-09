import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";

import { IPaymentService } from "./interfaces/Ipayment.service";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import ClientError from "../exceptions/client-error";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import {
  CreatePaymentDto,
  ListResponseDto,
  OutstandingSummaryDto,
  PaymentDirectionEnum,
  PaymentDto,
  PaymentFilterParams,
  PaymentMethodEnum,
  PaymentStatusEnum,
  PaymentTransferModel,
  PaymentVoucherDto,
  PaymentVoucherModel,
  ReversePaymentModel,
  UpdatePaymentDto,
  VoucherTypeEnum,
} from '@pms/types';
import {
  assertAllocationsFit,
  partyControlKey,
  requireCounterAccount,
  requireMoneyAccount,
  requireParty,
  resolveTransferLines,
  resolveVoucherLines,
  VOUCHER_TYPE_FOR_DIRECTION,
} from './payment-voucher';
import { IAccountingPostingService } from "./interfaces/Iaccounting-posting.service";
import { IJournalEntryService } from "./interfaces/Ijournal-entry.service";

@injectable()
export class PaymentService implements IPaymentService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.IAccountingPostingService) private accountingPosting: IAccountingPostingService,
    @inject(TYPES.IJournalEntryService) private journalEntryService: IJournalEntryService
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

  /**
   * Money in or out that is not a payment against a single sales order: a customer receipt, a
   * supplier payment, capital introduced, cash taken out. The voucher and its journal entry
   * commit together, and anything left unapplied stays on the payment as an advance.
   */
  async createVoucher(data: PaymentVoucherModel, storeCode: string, userId: string): Promise<PaymentVoucherDto> {
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime())) throw new ClientError('Enter a valid payment date');

    const amount = Math.round(Number(data.amount) * 100) / 100;
    if (!(amount > 0)) throw new ClientError('Enter an amount greater than zero');

    const paymentId = await this.unitOfWork.transaction(async (transactionClient) => {
      const moneyAccount = await requireMoneyAccount(data.moneyAccountId, storeCode, transactionClient);

      // A party settles its own control account; otherwise the caller says what the money was
      // for. The validator already refuses a voucher that names neither.
      let counterAccountId: number;
      let isPartyAccount = false;
      let label: string;

      if (data.partyId && data.partyType) {
        const partyName = await requireParty(data.partyType, data.partyId, storeCode, transactionClient);
        const key = partyControlKey(data.partyType);
        const resolved = await this.journalEntryService.resolveAccountIds(storeCode, [key], transactionClient);
        counterAccountId = resolved.get(key)!;
        isPartyAccount = true;
        label = data.direction === PaymentDirectionEnum.In ? `Received from ${partyName}` : `Paid to ${partyName}`;
      } else {
        const counter = await requireCounterAccount(data.counterAccountId!, storeCode, transactionClient);
        counterAccountId = counter.id;
        label = data.direction === PaymentDirectionEnum.In ? `Received into ${moneyAccount.name}` : `Paid from ${moneyAccount.name}`;
      }

      await assertAllocationsFit({ ...data, amount }, storeCode, transactionClient);

      const voucher = resolveVoucherLines({
        direction: data.direction,
        moneyAccountId: moneyAccount.id,
        counterAccountId,
        amount,
        isPartyAccount,
        label,
      });

      const paymentData = await transactionClient.payment.create({
        data: {
          storeCode,
          orderId: null,
          amount,
          method: data.method,
          status: PaymentStatusEnum.Paid,
          direction: data.direction,
          partyType: data.partyType ?? null,
          partyId: data.partyId || null,
          ledgerAccountId: moneyAccount.id,
          paymentDate,
          remarks: data.remarks ?? null,
          allocations: {
            createMany: {
              data: (data.allocations ?? []).map((allocation) => ({
                storeCode,
                targetType: allocation.targetType,
                targetId: allocation.targetId,
                amount: Math.round(Number(allocation.amount) * 100) / 100,
                createdById: userId,
              })),
            },
          },
        },
        select: { id: true },
      });

      await this.accountingPosting.postMoneyMovement(
        {
          storeCode,
          createdById: userId,
          voucherType: VOUCHER_TYPE_FOR_DIRECTION[data.direction as keyof typeof VOUCHER_TYPE_FOR_DIRECTION],
          entryDate: paymentDate,
          narration: voucher.narration,
          referenceNumber: data.referenceNumber ?? null,
          sourceType: 'payment',
          sourceId: paymentData.id,
          lines: voucher.lines,
          party: data.partyId && data.partyType ? { partyType: data.partyType, partyId: data.partyId } : null,
          partyAccountIds: voucher.partyAccountIds,
        },
        transactionClient
      );

      return paymentData.id;
    });

    return this.getVoucherById(paymentId, storeCode);
  }

  /**
   * The business's own money between its own accounts. Both sides are cash or bank, so this
   * can never become income or an expense - the usual way a cash book overstates turnover.
   */
  async transfer(data: PaymentTransferModel, storeCode: string, userId: string): Promise<PaymentVoucherDto> {
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime())) throw new ClientError('Enter a valid date');

    const amount = Math.round(Number(data.amount) * 100) / 100;
    if (!(amount > 0)) throw new ClientError('Enter an amount greater than zero');

    const paymentId = await this.unitOfWork.transaction(async (transactionClient) => {
      const from = await requireMoneyAccount(data.fromAccountId, storeCode, transactionClient);
      const to = await requireMoneyAccount(data.toAccountId, storeCode, transactionClient);
      const lines = resolveTransferLines({ ...data, amount });

      const paymentData = await transactionClient.payment.create({
        data: {
          storeCode,
          orderId: null,
          amount,
          method: PaymentMethodEnum.BankTransfer,
          status: PaymentStatusEnum.Paid,
          direction: PaymentDirectionEnum.Out,
          ledgerAccountId: from.id,
          paymentDate,
          remarks: data.remarks ?? `Transfer from ${from.name} to ${to.name}`,
        },
        select: { id: true },
      });

      await this.accountingPosting.postMoneyMovement(
        {
          storeCode,
          createdById: userId,
          voucherType: VoucherTypeEnum.Contra,
          entryDate: paymentDate,
          narration: `Transfer from ${from.name} to ${to.name}`,
          sourceType: 'payment',
          sourceId: paymentData.id,
          lines,
        },
        transactionClient
      );

      return paymentData.id;
    });

    return this.getVoucherById(paymentId, storeCode);
  }

  async getAllVouchers(filters?: PaymentFilterParams): Promise<ListResponseDto<PaymentVoucherDto>> {
    return this.unitOfWork.Payment.findAllVouchers(filters);
  }

  async getVoucherById(id: number, storeCode: string): Promise<PaymentVoucherDto> {
    const voucher = await this.unitOfWork.Payment.findVoucherById(id, storeCode);
    if (!voucher) throw new NotFoundError('Payment not found');
    return voucher;
  }

  /**
   * Undoing a payment reverses its journal entry and marks the payment cancelled; the row and
   * its original voucher both stay, because the books are append-only and money taken then
   * given back is two facts, not none. The allocations go, so whatever it was applied to is
   * open again.
   */
  async reverseVoucher(id: number, data: ReversePaymentModel, storeCode: string, userId: string): Promise<PaymentVoucherDto> {
    const existing = await this.getVoucherById(id, storeCode);
    if (existing.status === PaymentStatusEnum.Cancelled) throw new ClientError('This payment has already been reversed');

    if (existing.journalEntryId != null) {
      await this.journalEntryService.reverse(
        existing.journalEntryId,
        { narration: data.reason ?? `Reversal of payment ${existing.voucherNumber ?? existing.id}` },
        storeCode,
        userId
      );
    }

    await this.unitOfWork.transaction(async (transactionClient) => {
      await transactionClient.paymentAllocation.deleteMany({ where: { paymentId: id, storeCode } });
      await transactionClient.payment.update({
        where: { id },
        data: {
          status: PaymentStatusEnum.Cancelled,
          remarks: [existing.remarks, data.reason ? `Reversed: ${data.reason}` : 'Reversed'].filter(Boolean).join(' · '),
          updatedAt: new Date(),
        },
      });
    });

    return this.getVoucherById(id, storeCode);
  }

  async getOutstanding(storeCode: string): Promise<OutstandingSummaryDto> {
    return this.unitOfWork.Payment.outstanding(storeCode);
  }
}
