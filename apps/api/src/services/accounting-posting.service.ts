import { inject, injectable } from 'inversify';
import { OrderStatus, Prisma, ReturnStatus } from '@prisma/client';
import { TYPES } from '../config/ioc.types';
import {
  AccountingBackfillModel,
  AccountingBackfillResultDto,
  AccountSystemKey,
  buildPurchaseLines,
  buildReceiptLines,
  buildSaleLines,
  buildSalesReturnLines,
  MoneyAccountKey,
  PartyTypeEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  PostingLineSpec,
  PostingSourceTypeEnum,
  proportionalTax,
  PurchaseStatusEnum,
  StatusEnum,
  VoucherType,
  VoucherTypeEnum,
  TaxCategoryEnum,
  TaxTypeEnum,
} from '@pms/types';
import { effectiveOn, EFFECTIVE_ORDER } from '../utils/variant-pricing';
import logger from '../utils/logger';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IAccountingPostingService, MoneyMovementPosting } from './interfaces/Iaccounting-posting.service';
import { IJournalEntryService } from './interfaces/Ijournal-entry.service';

/**
 * `sourceType` values are the Prisma model names, and together with the row id they form the
 * journal's double-post guard. Changing one of these strings orphans every voucher already
 * posted under the old name, so they are fixed.
 */
const SOURCE = {
  order: 'order',
  payment: 'payment',
  purchase: 'purchase',
  orderReturn: 'orderReturn',
} as const;

/**
 * The only accounts a party is tagged on. A customer or supplier ledger is the control
 * account's lines filtered by party, so tagging revenue or GST lines too would make any
 * "everything for this party" view double-count the same sale.
 */
const PARTY_BEARING_ACCOUNTS: AccountSystemKey[] = [
  'ACCOUNTS_RECEIVABLE',
  'ACCOUNTS_PAYABLE',
  'ADVANCE_FROM_CUSTOMER',
  'ADVANCE_TO_SUPPLIER',
];

/** Which money account a method settles into. PAY_LATER moves nothing, so it has none. */
const MONEY_ACCOUNT_BY_METHOD: Record<string, MoneyAccountKey | null> = {
  [PaymentMethodEnum.Cash]: 'CASH_IN_HAND',
  [PaymentMethodEnum.Card]: 'BANK_ACCOUNT',
  [PaymentMethodEnum.Upi]: 'BANK_ACCOUNT',
  [PaymentMethodEnum.BankTransfer]: 'BANK_ACCOUNT',
  [PaymentMethodEnum.Online]: 'BANK_ACCOUNT',
  [PaymentMethodEnum.PayLater]: null,
};

@injectable()
export class AccountingPostingService implements IAccountingPostingService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.IJournalEntryService) private journalEntryService: IJournalEntryService
  ) {}

  async isConfigured(storeCode: string, transactionClient: Prisma.TransactionClient): Promise<boolean> {
    const count = await transactionClient.ledgerAccount.count({ where: { storeCode, systemKey: { not: null } } });
    return count > 0;
  }

  /**
   * The ids for these system keys, or null when the chart cannot satisfy them.
   *
   * A store whose chart is incomplete must still be able to sell, so a missing or unpostable
   * account skips the voucher with a loud warning instead of throwing - throwing here would
   * roll the sale back, which is the one thing automatic posting must never do. Genuine
   * faults (unbalanced lines, a closed year) still throw from the journal itself.
   */
  private async resolveOrSkip(
    keys: AccountSystemKey[],
    storeCode: string,
    sourceType: string,
    sourceId: number,
    transactionClient: Prisma.TransactionClient
  ): Promise<Map<string, number> | null> {
    const accounts = await transactionClient.ledgerAccount.findMany({
      where: { storeCode, systemKey: { in: keys }, status: { not: StatusEnum.Trash }, isActive: true },
      select: { id: true, systemKey: true, _count: { select: { children: { where: { status: { not: StatusEnum.Trash } } } } } },
    });

    const usable = accounts.filter((account) => account.systemKey != null && account._count.children === 0);
    const byKey = new Map(usable.map((account) => [account.systemKey!, account.id] as const));
    const missing = keys.filter((key) => !byKey.has(key));

    if (missing.length > 0) {
      logger.warn('Skipped accounting posting: chart of accounts cannot satisfy the rule', {
        storeCode,
        sourceType,
        sourceId,
        missing,
      });
      return null;
    }
    return byKey;
  }

  async postSale(orderId: number, storeCode: string, createdById: string, transactionClient: Prisma.TransactionClient): Promise<number | null> {
    const order = await transactionClient.order.findFirst({
      where: { id: orderId, storeCode },
      select: {
        id: true,
        orderNumber: true,
        orderDate: true,
        customerId: true,
        totalAmount: true,
        tax: true,
        discount: true,
        shippingCost: true,
        grandTotal: true,
        isInterState: true,
        status: true,
      },
    });
    if (!order) return null;

    // A cancelled order was never a sale, so it must not sit in the books as a receivable.
    // This matters most to the backfill, which walks a whole history including cancellations.
    if (order.status === OrderStatus.CANCELLED) return null;
    if (order.grandTotal <= 0) return null;

    const specs = buildSaleLines({
      totalAmount: order.totalAmount,
      tax: order.tax,
      discount: order.discount,
      shippingCost: order.shippingCost,
      grandTotal: order.grandTotal,
      isInterState: order.isInterState,
    });

    return this.postSpecs({
      specs,
      storeCode,
      createdById,
      transactionClient,
      voucherType: VoucherTypeEnum.Sales,
      entryDate: order.orderDate,
      narration: `Sale ${order.orderNumber}`,
      referenceNumber: order.orderNumber,
      sourceType: SOURCE.order,
      sourceId: order.id,
      party: { partyType: PartyTypeEnum.Customer, partyId: order.customerId },
    });
  }

  async postReceipt(paymentId: number, storeCode: string, createdById: string, transactionClient: Prisma.TransactionClient): Promise<number | null> {
    const payment = await transactionClient.payment.findFirst({
      where: { id: paymentId, storeCode },
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        paymentDate: true,
        orderId: true,
        order: { select: { orderNumber: true, customerId: true } },
      },
    });
    if (!payment) return null;

    // An unpaid udhari line records an intention, not a movement of money: the receivable was
    // already raised by the sale, so posting it again would double the customer's balance.
    if (payment.status !== PaymentStatusEnum.Paid) return null;
    const moneyAccount = MONEY_ACCOUNT_BY_METHOD[payment.method] ?? null;
    if (!moneyAccount) return null;
    if (payment.amount <= 0) return null;

    const specs = buildReceiptLines({ amount: payment.amount, moneyAccount });
    const reference = payment.order?.orderNumber ?? null;

    return this.postSpecs({
      specs,
      storeCode,
      createdById,
      transactionClient,
      voucherType: VoucherTypeEnum.Receipt,
      entryDate: payment.paymentDate,
      narration: reference ? `Receipt against ${reference}` : 'Receipt',
      referenceNumber: reference,
      sourceType: SOURCE.payment,
      sourceId: payment.id,
      party: payment.order?.customerId ? { partyType: PartyTypeEnum.Customer, partyId: payment.order.customerId } : null,
    });
  }

  async postPurchase(purchaseId: number, storeCode: string, createdById: string, transactionClient: Prisma.TransactionClient): Promise<number | null> {
    const purchase = await transactionClient.purchase.findFirst({
      where: { id: purchaseId, storeCode },
      select: {
        id: true,
        invoiceNumber: true,
        purchaseDate: true,
        totalAmount: true,
        supplierId: true,
        supplierName: true,
        status: true,
        items: { select: { variantId: true, totalPrice: true } },
      },
    });
    if (!purchase) return null;
    if (purchase.status === PurchaseStatusEnum.Cancelled) return null;
    if (purchase.totalAmount <= 0) return null;

    const { tax, isInterState } = await this.purchaseInputTax(purchase, storeCode, transactionClient);
    const specs = buildPurchaseLines({ totalAmount: purchase.totalAmount, tax, isInterState });

    return this.postSpecs({
      specs,
      storeCode,
      createdById,
      transactionClient,
      voucherType: VoucherTypeEnum.Purchase,
      entryDate: purchase.purchaseDate,
      narration: purchase.supplierName ? `Purchase from ${purchase.supplierName}` : 'Purchase',
      referenceNumber: purchase.invoiceNumber ?? null,
      sourceType: SOURCE.purchase,
      sourceId: purchase.id,
      party: purchase.supplierId ? { partyType: PartyTypeEnum.Supplier, partyId: purchase.supplierId } : null,
    });
  }

  /**
   * The GST sitting inside a purchase, line by line from the price row in force on the
   * purchase date - the same source the purchase was costed from. Only a cost entered WithTax
   * carries extractable GST; a row typed WithoutTax or carrying no tax contributes nothing,
   * because the supplier's bill total is what was recorded and nothing may be added on top of
   * it here. Place of supply follows the supplier's state against the store's - D4 put both
   * on file for exactly this.
   */
  private async purchaseInputTax(
    purchase: { purchaseDate: Date; supplierId: string | null; items: { variantId: number; totalPrice: Prisma.Decimal }[] },
    storeCode: string,
    transactionClient: Prisma.TransactionClient
  ): Promise<{ tax: number; isInterState: boolean }> {
    const variantIds = [...new Set(purchase.items.map((item) => item.variantId))];
    if (variantIds.length === 0) return { tax: 0, isInterState: false };

    const priceRows = await transactionClient.priceHistory.findMany({
      where: { variantId: { in: variantIds }, ...effectiveOn(purchase.purchaseDate) },
      orderBy: EFFECTIVE_ORDER,
      select: { variantId: true, purchaseTaxType: true, taxId: true },
    });
    const priceByVariant = new Map<number, (typeof priceRows)[number]>();
    for (const row of priceRows) if (!priceByVariant.has(row.variantId)) priceByVariant.set(row.variantId, row);

    const taxIds = [...new Set([...priceByVariant.values()].map((row) => row.taxId).filter((id): id is string => id != null))];
    const taxRows =
      taxIds.length > 0
        ? await transactionClient.tax.findMany({ where: { id: { in: taxIds } }, select: { id: true, rate: true, category: true } })
        : [];
    const rateById = new Map(taxRows.map((row) => [row.id, row.category === TaxCategoryEnum.Taxable ? row.rate.toNumber() : 0] as const));

    let tax = 0;
    for (const item of purchase.items) {
      const priceRow = priceByVariant.get(item.variantId);
      if (priceRow?.purchaseTaxType !== TaxTypeEnum.WithTax || !priceRow.taxId) continue;
      const rate = rateById.get(priceRow.taxId) ?? 0;
      if (rate > 0) tax += (item.totalPrice.toNumber() * rate) / (100 + rate);
    }

    let isInterState = false;
    const supplierId = Number(purchase.supplierId);
    if (Number.isFinite(supplierId) && supplierId > 0) {
      const [supplier, store] = await Promise.all([
        transactionClient.supplier.findFirst({ where: { id: supplierId, storeCode }, select: { stateCode: true } }),
        transactionClient.store.findUnique({ where: { code: storeCode }, select: { stateCode: true } }),
      ]);
      isInterState = !!supplier?.stateCode && !!store?.stateCode && supplier.stateCode !== store.stateCode;
    }

    return { tax: Math.round(tax * 100) / 100, isInterState };
  }

  async postSalesReturn(returnId: number, storeCode: string, createdById: string, transactionClient: Prisma.TransactionClient): Promise<number | null> {
    const orderReturn = await transactionClient.orderReturn.findFirst({
      where: { id: returnId, storeCode },
      select: {
        id: true,
        returnNumber: true,
        status: true,
        refundAmount: true,
        refundMethod: true,
        customerId: true,
        createdAt: true,
        resolvedAt: true,
        order: { select: { orderNumber: true, tax: true, grandTotal: true } },
      },
    });
    if (!orderReturn) return null;

    // Only a completed return has actually given anything back. The guard matters for the
    // backfill, which walks every return in the history including ones still being argued over.
    if (orderReturn.status !== ReturnStatus.COMPLETED) return null;
    if (orderReturn.refundAmount <= 0) return null;

    // A refund paid out in cash or back to a card leaves by that route; with no method
    // recorded it only cancels what the customer still owes.
    const refundTo: MoneyAccountKey | 'ACCOUNTS_RECEIVABLE' = orderReturn.refundMethod
      ? (MONEY_ACCOUNT_BY_METHOD[orderReturn.refundMethod] ?? 'ACCOUNTS_RECEIVABLE')
      : 'ACCOUNTS_RECEIVABLE';

    const specs = buildSalesReturnLines({
      refundAmount: orderReturn.refundAmount,
      taxPortion: proportionalTax(orderReturn.refundAmount, orderReturn.order?.tax ?? 0, orderReturn.order?.grandTotal ?? 0),
      refundTo,
    });

    return this.postSpecs({
      specs,
      storeCode,
      createdById,
      transactionClient,
      voucherType: VoucherTypeEnum.SalesReturn,
      entryDate: orderReturn.resolvedAt ?? new Date(),
      narration: `Return ${orderReturn.returnNumber}`,
      referenceNumber: orderReturn.order?.orderNumber ?? orderReturn.returnNumber,
      sourceType: SOURCE.orderReturn,
      sourceId: orderReturn.id,
      party: { partyType: PartyTypeEnum.Customer, partyId: orderReturn.customerId },
    });
  }

  /**
   * Posts a batch of documents that pre-date the posting rules. Each document gets its own
   * small transaction on purpose: one transaction spanning a whole history would exceed the
   * database timeout and roll every voucher back, and a per-document transaction means a
   * single bad row cannot undo the rest. The caller walks forward with `afterId`.
   */
  async backfill(data: AccountingBackfillModel, storeCode: string, userId: string): Promise<AccountingBackfillResultDto> {
    const limit = Math.min(Math.max(data.limit ?? 50, 1), 200);
    const afterId = data.afterId ?? 0;
    const where = { storeCode, id: { gt: afterId } };
    const page = { where, orderBy: { id: 'asc' as const }, take: limit, select: { id: true } };

    const candidates =
      data.sourceType === PostingSourceTypeEnum.Order
        ? await this.unitOfWork.transaction((tx) => tx.order.findMany(page))
        : data.sourceType === PostingSourceTypeEnum.Payment
          ? await this.unitOfWork.transaction((tx) => tx.payment.findMany(page))
          : data.sourceType === PostingSourceTypeEnum.Purchase
            ? await this.unitOfWork.transaction((tx) => tx.purchase.findMany(page))
            : await this.unitOfWork.transaction((tx) => tx.orderReturn.findMany(page));

    const result: AccountingBackfillResultDto = {
      sourceType: data.sourceType,
      scanned: candidates.length,
      posted: 0,
      skipped: 0,
      failed: 0,
      lastId: candidates.length > 0 ? candidates[candidates.length - 1]!.id : null,
      hasMore: candidates.length === limit,
      errors: [],
    };

    for (const candidate of candidates) {
      try {
        const entryId = await this.unitOfWork.transaction(async (transactionClient) => {
          switch (data.sourceType) {
            case PostingSourceTypeEnum.Order:
              return this.postSale(candidate.id, storeCode, userId, transactionClient);
            case PostingSourceTypeEnum.Payment:
              return this.postReceipt(candidate.id, storeCode, userId, transactionClient);
            case PostingSourceTypeEnum.Purchase:
              return this.postPurchase(candidate.id, storeCode, userId, transactionClient);
            default:
              return this.postSalesReturn(candidate.id, storeCode, userId, transactionClient);
          }
        });

        if (entryId == null) result.skipped += 1;
        else result.posted += 1;
      } catch (error) {
        result.failed += 1;
        const message = error instanceof Error ? error.message : 'Could not post this document';
        if (result.errors.length < 20) result.errors.push({ id: candidate.id, message });
        logger.warn('Backfill could not post a document', { storeCode, sourceType: data.sourceType, sourceId: candidate.id, message });
      }
    }

    return result;
  }

  /**
   * Posts a voucher whose accounts the user chose. The same two guards as every other rule
   * apply - already-posted is a no-op, and an unconfigured store skips rather than blocking
   * the document - but there is no system-key lookup, because the ids are already known.
   */
  async postMoneyMovement(args: MoneyMovementPosting, transactionClient: Prisma.TransactionClient): Promise<number | null> {
    if (args.lines.length < 2) return null;

    const alreadyPosted = await transactionClient.journalEntry.findUnique({
      where: { storeCode_sourceType_sourceId: { storeCode: args.storeCode, sourceType: args.sourceType, sourceId: args.sourceId } },
      select: { id: true },
    });
    if (alreadyPosted) return alreadyPosted.id;

    if (!(await this.isConfigured(args.storeCode, transactionClient))) {
      logger.warn('Skipped accounting posting: store has no chart of accounts', {
        storeCode: args.storeCode,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
      });
      return null;
    }

    const partyAccounts = new Set(args.partyAccountIds ?? []);

    return this.journalEntryService.post(
      {
        storeCode: args.storeCode,
        createdById: args.createdById,
        voucherType: args.voucherType,
        entryDate: args.entryDate,
        narration: args.narration,
        referenceNumber: args.referenceNumber ?? null,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        lines: args.lines.map((line) => {
          const carriesParty = args.party != null && partyAccounts.has(line.ledgerAccountId);
          return {
            ledgerAccountId: line.ledgerAccountId,
            debit: line.debit,
            credit: line.credit,
            partyType: carriesParty ? args.party!.partyType : null,
            partyId: carriesParty ? args.party!.partyId : null,
          };
        }),
      },
      transactionClient
    );
  }

  /**
   * Resolves the account keys and hands the lines to the journal. A store with no chart of
   * accounts posts nothing and the document saves normally; anything else - an unbalanced set
   * of lines, a missing account, a closed year - is a real fault and is allowed to throw so
   * the document rolls back with it.
   */
  private async postSpecs(args: {
    specs: PostingLineSpec[];
    storeCode: string;
    createdById: string;
    transactionClient: Prisma.TransactionClient;
    voucherType: VoucherType;
    entryDate: Date;
    narration: string;
    referenceNumber: string | null;
    sourceType: string;
    sourceId: number;
    party: { partyType: string; partyId: string } | null;
  }): Promise<number | null> {
    if (args.specs.length < 2) return null;

    // Posting the same document twice is a no-op rather than an error, so a retried save, a
    // status change that re-runs the rule, and the backfill can all call this freely.
    const alreadyPosted = await args.transactionClient.journalEntry.findUnique({
      where: { storeCode_sourceType_sourceId: { storeCode: args.storeCode, sourceType: args.sourceType, sourceId: args.sourceId } },
      select: { id: true },
    });
    if (alreadyPosted) return alreadyPosted.id;

    if (!(await this.isConfigured(args.storeCode, args.transactionClient))) {
      logger.warn('Skipped accounting posting: store has no chart of accounts', {
        storeCode: args.storeCode,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
      });
      return null;
    }

    const keys = [...new Set(args.specs.map((spec) => spec.account))] as AccountSystemKey[];
    const idByKey = await this.resolveOrSkip(keys, args.storeCode, args.sourceType, args.sourceId, args.transactionClient);
    if (!idByKey) return null;

    return this.journalEntryService.post(
      {
        storeCode: args.storeCode,
        createdById: args.createdById,
        voucherType: args.voucherType,
        entryDate: args.entryDate,
        narration: args.narration,
        referenceNumber: args.referenceNumber,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        lines: args.specs.map((spec) => {
          const carriesParty = args.party != null && PARTY_BEARING_ACCOUNTS.includes(spec.account);
          return {
            ledgerAccountId: idByKey.get(spec.account)!,
            debit: spec.debit,
            credit: spec.credit,
            partyType: carriesParty ? args.party!.partyType : null,
            partyId: carriesParty ? args.party!.partyId : null,
          };
        }),
      },
      args.transactionClient
    );
  }
}
