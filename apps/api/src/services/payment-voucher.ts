import {
  AccountSystemKey,
  buildMoneyVoucherLines,
  buildTransferLines,
  PartyTypeEnum,
  PaymentDirectionEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  PaymentTransferModel,
  PaymentVoucherModel,
  PostingLineByIdSpec,
  VoucherTypeEnum,
} from '@pms/types';
import { AccountSubType, Prisma } from '@prisma/client';
import ClientError from '../exceptions/client-error';
import NotFoundError from '../exceptions/not-found-error';

/**
 * The rules a money voucher has to satisfy before it can be written, kept out of the service
 * so each one can be read on its own. Everything here runs on the caller's transaction client,
 * because the checks are only meaningful against the same snapshot the write uses.
 */

export interface ResolvedVoucher {
  lines: PostingLineByIdSpec[];
  /** The control-account lines that carry the party, so a subledger stays traceable. */
  partyAccountIds: number[];
  narration: string;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** The cash or bank account money moved through, verified to be exactly that. */
export async function requireMoneyAccount(id: number, storeCode: string, transactionClient: Prisma.TransactionClient) {
  const account = await transactionClient.ledgerAccount.findUnique({
    where: { storeCode_id: { storeCode, id } },
    select: { id: true, name: true, subType: true, isActive: true, status: true, _count: { select: { children: true } } },
  });
  if (!account || account.status === 'Trash') throw new NotFoundError('That cash or bank account was not found');
  if (account.subType !== AccountSubType.CASH && account.subType !== AccountSubType.BANK) {
    throw new ClientError(`"${account.name}" is not a cash or bank account, so money cannot move through it`);
  }
  if (!account.isActive) throw new ClientError(`"${account.name}" is inactive`);
  if (account._count.children > 0) throw new ClientError(`"${account.name}" is a group heading`);
  return account;
}

/** Any postable account, used for the "what was this for" side of a cash in or out. */
export async function requireCounterAccount(id: number, storeCode: string, transactionClient: Prisma.TransactionClient) {
  const account = await transactionClient.ledgerAccount.findUnique({
    where: { storeCode_id: { storeCode, id } },
    select: { id: true, name: true, isActive: true, status: true, _count: { select: { children: true } } },
  });
  if (!account || account.status === 'Trash') throw new NotFoundError('That account was not found');
  if (!account.isActive) throw new ClientError(`"${account.name}" is inactive`);
  if (account._count.children > 0) throw new ClientError(`"${account.name}" is a group heading; pick an account under it`);
  return account;
}

/** The party must exist, or a subledger would accrue a balance nobody can chase. */
export async function requireParty(
  partyType: string,
  partyId: string,
  storeCode: string,
  transactionClient: Prisma.TransactionClient
): Promise<string> {
  if (partyType === PartyTypeEnum.Customer) {
    const customer = await transactionClient.users.findUnique({ where: { userId: partyId }, select: { name: true } });
    if (!customer) throw new NotFoundError('That customer was not found');
    return customer.name;
  }

  if (partyType === PartyTypeEnum.Supplier) {
    const id = Number(partyId);
    if (!Number.isFinite(id)) throw new ClientError('That supplier id is not valid');
    const supplier = await transactionClient.supplier.findFirst({ where: { id, storeCode }, select: { name: true } });
    if (!supplier) throw new NotFoundError('That supplier was not found in this store');
    return supplier.name;
  }

  throw new ClientError('Only a customer or a supplier can be settled this way');
}

/**
 * Which control account a party's side of the money lands in. A customer paying in settles
 * what they owe; paying a customer out is a refund against the same account, and the same
 * holds the other way round for a supplier - so the account follows the party, not the
 * direction.
 */
export function partyControlKey(partyType: string): AccountSystemKey {
  return partyType === PartyTypeEnum.Customer ? 'ACCOUNTS_RECEIVABLE' : 'ACCOUNTS_PAYABLE';
}

/**
 * Allocations may only point at documents in this store, and may not over-apply: the sum of
 * what has already been applied to a document plus this payment cannot exceed what the
 * document is worth. Without this, two payments could each claim to settle the same invoice.
 */
export async function assertAllocationsFit(
  data: PaymentVoucherModel,
  storeCode: string,
  transactionClient: Prisma.TransactionClient
): Promise<void> {
  const allocations = data.allocations ?? [];
  if (allocations.length === 0) return;

  const total = round2(allocations.reduce((sum, row) => sum + Number(row.amount || 0), 0));
  if (total > round2(Number(data.amount))) {
    throw new ClientError('The amounts applied add up to more than the payment');
  }

  for (const allocation of allocations) {
    const amount = round2(Number(allocation.amount));
    if (amount <= 0) throw new ClientError('An applied amount must be more than zero');

    if (allocation.targetType === 'ORDER') {
      const order = await transactionClient.order.findFirst({
        where: { id: allocation.targetId, storeCode },
        select: { grandTotal: true, orderNumber: true },
      });
      if (!order) throw new NotFoundError(`Order ${allocation.targetId} was not found in this store`);

      const applied = await transactionClient.paymentAllocation.aggregate({
        where: { storeCode, targetType: 'ORDER', targetId: allocation.targetId },
        _sum: { amount: true },
      });
      const already = round2(applied._sum.amount?.toNumber() ?? 0);
      if (round2(already + amount) > round2(order.grandTotal)) {
        throw new ClientError(`Order ${order.orderNumber} would be over-applied: it is worth ${order.grandTotal} and ${already} is already applied`);
      }
    } else if (allocation.targetType === 'PURCHASE') {
      const purchase = await transactionClient.purchase.findFirst({
        where: { id: allocation.targetId, storeCode },
        select: { totalAmount: true, invoiceNumber: true },
      });
      if (!purchase) throw new NotFoundError(`Purchase ${allocation.targetId} was not found in this store`);

      const applied = await transactionClient.paymentAllocation.aggregate({
        where: { storeCode, targetType: 'PURCHASE', targetId: allocation.targetId },
        _sum: { amount: true },
      });
      const already = round2(applied._sum.amount?.toNumber() ?? 0);
      if (round2(already + amount) > round2(purchase.totalAmount)) {
        throw new ClientError(`That purchase would be over-applied: it is worth ${purchase.totalAmount} and ${already} is already applied`);
      }
    } else {
      throw new ClientError('Expenses cannot be settled from here yet');
    }
  }
}

/** The lines a money voucher posts, once its accounts are known to be usable. */
export function resolveVoucherLines(args: {
  direction: string;
  moneyAccountId: number;
  counterAccountId: number;
  amount: number;
  isPartyAccount: boolean;
  label: string;
}): ResolvedVoucher {
  const lines = buildMoneyVoucherLines({
    direction: args.direction === PaymentDirectionEnum.In ? 'IN' : 'OUT',
    moneyAccountId: args.moneyAccountId,
    counterAccountId: args.counterAccountId,
    amount: args.amount,
  });
  if (lines.length < 2) throw new ClientError('This voucher would not move anything');

  return {
    lines,
    partyAccountIds: args.isPartyAccount ? [args.counterAccountId] : [],
    narration: args.label,
  };
}

/** The lines a transfer posts: the business's own money between its own accounts. */
export function resolveTransferLines(data: PaymentTransferModel): PostingLineByIdSpec[] {
  const lines = buildTransferLines({ fromAccountId: data.fromAccountId, toAccountId: data.toAccountId, amount: Number(data.amount) });
  if (lines.length < 2) throw new ClientError('A transfer needs two different accounts and an amount');
  return lines;
}

export const VOUCHER_TYPE_FOR_DIRECTION = {
  [PaymentDirectionEnum.In]: VoucherTypeEnum.Receipt,
  [PaymentDirectionEnum.Out]: VoucherTypeEnum.Payment,
} as const;

export const SETTLED_STATUS = PaymentStatusEnum.Paid;
export const DEFAULT_METHOD = PaymentMethodEnum.Cash;
