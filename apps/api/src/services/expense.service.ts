import { inject, injectable } from 'inversify';
import { Prisma } from '@prisma/client';
import { TYPES } from '../config/ioc.types';
import {
  buildExpenseLines,
  computeExpenseTotals,
  ExpenseDto,
  ExpenseFilterParams,
  ExpenseModel,
  ExpenseStatus,
  ExpenseStatusEnum,
  ExpenseStatusModel,
  ExpenseSummaryDto,
  ExpenseSummaryParams,
  ListResponseDto,
  PartyTypeEnum,
  RecurrenceIntervalEnum,
  TaxCategoryEnum,
  TaxType,
  TaxTypeEnum,
  VoucherTypeEnum,
} from '@pms/types';
import ClientError from '../exceptions/client-error';
import ForbiddenError from '../exceptions/forbidden-error';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import logger from '../utils/logger';
import { IAccountingPostingService } from './interfaces/Iaccounting-posting.service';
import { IExpenseService } from './interfaces/Iexpense.service';
import { requireCounterAccount, requireMoneyAccount } from './payment-voucher';

/**
 * `sourceType` values tie an expense to its vouchers through the journal's double-post guard.
 * An expense can produce two: recognising the cost, and later settling the payable it created.
 * They must differ or the second could never post, and changing either string orphans every
 * voucher already written under the old one.
 */
const SOURCE = {
  expense: 'expense',
  expensePayment: 'expensePayment',
} as const;

/** Which statuses have reached the journal and so can no longer have their money edited. */
const POSTED_STATUSES: ExpenseStatus[] = [ExpenseStatusEnum.Approved, ExpenseStatusEnum.Paid];

const ALLOWED_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  [ExpenseStatusEnum.Draft]: [ExpenseStatusEnum.Approved, ExpenseStatusEnum.Paid, ExpenseStatusEnum.Cancelled],
  [ExpenseStatusEnum.Approved]: [ExpenseStatusEnum.Paid, ExpenseStatusEnum.Cancelled],
  [ExpenseStatusEnum.Paid]: [],
  [ExpenseStatusEnum.Cancelled]: [],
};

const MONTHS_BY_INTERVAL: Record<string, number> = {
  [RecurrenceIntervalEnum.Monthly]: 1,
  [RecurrenceIntervalEnum.Quarterly]: 3,
  [RecurrenceIntervalEnum.Yearly]: 12,
};

@injectable()
export class ExpenseService implements IExpenseService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork,
    @inject(TYPES.IAccountingPostingService) private postingService: IAccountingPostingService
  ) {}

  async create(data: ExpenseModel, storeCode: string, createdById: string): Promise<ExpenseDto> {
    const status = (data.status as ExpenseStatus) ?? ExpenseStatusEnum.Draft;
    if (data.isTemplate && status !== ExpenseStatusEnum.Draft) {
      throw new ClientError('A recurring template is a definition, not an expense, so it cannot be approved or paid');
    }

    // Two concurrent creates can draw the same per-store number; the unique constraint rejects
    // one and a single retry draws the next number.
    let created: { id: number } | null = null;
    for (let attempt = 0; created === null; attempt++) {
      try {
        created = await this.unitOfWork.transaction(async (transactionClient) => {
          const row = await this.insert(data, storeCode, createdById, status, null, transactionClient);
          if (!data.isTemplate && POSTED_STATUSES.includes(status)) {
            await this.postExpense(row.id, storeCode, createdById, transactionClient);
          }
          return row;
        });
      } catch (error) {
        if (attempt === 0 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
        throw error;
      }
    }

    const expense = await this.unitOfWork.Expense.findById(created.id);
    return expense!;
  }

  async getAll(filters?: ExpenseFilterParams): Promise<ListResponseDto<ExpenseDto>> {
    return this.unitOfWork.Expense.findAll(filters);
  }

  async getById(id: number, storeCode?: string): Promise<ExpenseDto | null> {
    const expense = await this.unitOfWork.Expense.findById(id);
    if (!expense) return null;
    if (storeCode && expense.storeCode !== storeCode) throw new ForbiddenError('That expense belongs to another store');
    return expense;
  }

  /**
   * Editing is only free while the expense is a draft. Once it has been approved or paid its
   * voucher is in the journal, and silently changing the amount underneath it would leave the
   * books disagreeing with the record they were posted from - so the money fields are frozen
   * and only the descriptive ones stay open.
   */
  async update(id: number, data: ExpenseModel, storeCode: string, updatedById: string): Promise<ExpenseDto> {
    const existing = await this.requireExpense(id, storeCode);

    if (existing.status === ExpenseStatusEnum.Cancelled) throw new ClientError('A cancelled expense cannot be edited');

    if (POSTED_STATUSES.includes(existing.status)) {
      const totals = this.resolveTotalsFromModel(data, existing.taxRate, data.taxType ?? existing.taxType ?? null);
      if (totals.totalAmount !== existing.totalAmount || data.expenseAccountId !== existing.expenseAccountId) {
        throw new ClientError(
          'This expense is already posted to the books. Cancel it and record a new one rather than changing the amount or the account.'
        );
      }
    }

    await this.unitOfWork.transaction(async (transactionClient) => {
      const fields = await this.moneyFields(data, storeCode, transactionClient);
      const descriptive = await this.descriptiveFields(data, storeCode, transactionClient);

      await transactionClient.expense.update({
        where: { id },
        data: POSTED_STATUSES.includes(existing.status)
          ? { ...descriptive, updatedById }
          : { ...descriptive, ...fields, updatedById },
      });
    });

    const expense = await this.unitOfWork.Expense.findById(id);
    return expense!;
  }

  /**
   * The status is what drives the accounting. Approving recognises the cost against Accounts
   * Payable, so it shows as a liability until settled; paying either settles that payable or,
   * from a draft, recognises and pays in one voucher. Cancelling a posted expense is refused
   * here: an entry in the journal is undone by a reversal, not by a status flip.
   */
  async updateStatus(id: number, data: ExpenseStatusModel, storeCode: string, changedById: string): Promise<ExpenseDto> {
    const existing = await this.requireExpense(id, storeCode);
    if (existing.isTemplate) throw new ClientError('A recurring template has no status to change');

    const next = data.status as ExpenseStatus;
    if (!ALLOWED_TRANSITIONS[existing.status].includes(next)) {
      throw new ClientError(`An expense that is ${existing.status.toLowerCase()} cannot become ${next.toLowerCase()}`);
    }
    if (next === ExpenseStatusEnum.Cancelled && POSTED_STATUSES.includes(existing.status)) {
      throw new ClientError('This expense is already in the books. Reverse its voucher from the day book instead of cancelling it.');
    }
    if (next === ExpenseStatusEnum.Paid && !data.paidFromAccountId) {
      throw new ClientError('Choose the cash or bank account the money left from');
    }

    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

    await this.unitOfWork.transaction(async (transactionClient) => {
      if (data.paidFromAccountId) await requireMoneyAccount(data.paidFromAccountId, storeCode, transactionClient);

      await transactionClient.expense.update({
        where: { id },
        data: {
          status: next,
          updatedById: changedById,
          ...(next === ExpenseStatusEnum.Approved && { approvedById: changedById, approvedAt: new Date() }),
          ...(next === ExpenseStatusEnum.Paid && {
            paidFromAccountId: data.paidFromAccountId ?? null,
            paidAt: paymentDate,
            ...(existing.approvedAt == null && { approvedById: changedById, approvedAt: new Date() }),
          }),
          ...(data.note ? { notes: data.note } : {}),
        },
      });

      if (next === ExpenseStatusEnum.Approved) {
        await this.postExpense(id, storeCode, changedById, transactionClient);
      }
      if (next === ExpenseStatusEnum.Paid) {
        // From a draft this is one voucher that both recognises and pays the cost; from an
        // approved expense the cost is already in, so only the payable is settled.
        if (existing.status === ExpenseStatusEnum.Draft) await this.postExpense(id, storeCode, changedById, transactionClient);
        else await this.postExpenseSettlement(id, storeCode, changedById, paymentDate, transactionClient);
      }
    });

    const expense = await this.unitOfWork.Expense.findById(id);
    return expense!;
  }

  async delete(id: number, storeCode: string): Promise<ExpenseDto> {
    const existing = await this.requireExpense(id, storeCode);
    if (POSTED_STATUSES.includes(existing.status)) {
      throw new ClientError('This expense is in the books and cannot be deleted. Reverse its voucher from the day book instead.');
    }
    return this.unitOfWork.Expense.delete(id);
  }

  async getSummary(storeCode: string, filters?: ExpenseSummaryParams): Promise<ExpenseSummaryDto> {
    return this.unitOfWork.Expense.summary(storeCode, filters);
  }

  /**
   * Generates the expenses that recurring templates have fallen due for and rolls each
   * template to its next date. Generated expenses land as drafts: a template says what the
   * rent is, not that this month's rent has been approved, so a person still confirms it.
   */
  async runRecurring(storeCode: string, createdById: string): Promise<ExpenseDto[]> {
    const today = new Date();
    const templates = await this.unitOfWork.Expense.findDueTemplates(storeCode, today);
    const createdIds: number[] = [];

    for (const template of templates) {
      const dueDate = template.recurrenceNextDate ? new Date(template.recurrenceNextDate) : today;
      try {
        const created = await this.unitOfWork.transaction(async (transactionClient) => {
          const row = await this.insert(
            {
              expenseDate: dueDate,
              expenseAccountId: template.expenseAccountId,
              supplierId: template.supplierId ?? null,
              partyType: template.partyType ?? null,
              partyId: template.partyId ?? null,
              referenceNumber: template.referenceNumber ?? null,
              notes: template.notes ?? null,
              amount: template.amount,
              taxId: template.taxId ?? null,
              taxType: template.taxType ?? null,
              isInterState: template.isInterState,
              attachments: [],
            },
            storeCode,
            createdById,
            ExpenseStatusEnum.Draft,
            template.id,
            transactionClient
          );

          await transactionClient.expense.update({
            where: { id: template.id },
            data: { recurrenceNextDate: this.advance(dueDate, template.recurrenceInterval) },
          });
          return row;
        });
        createdIds.push(created.id);
      } catch (error) {
        logger.warn('Skipped a recurring expense that could not be generated', {
          storeCode,
          templateId: template.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const generated = await Promise.all(createdIds.map((id) => this.unitOfWork.Expense.findById(id)));
    return generated.filter((expense): expense is ExpenseDto => expense !== null);
  }

  private async requireExpense(id: number, storeCode: string): Promise<ExpenseDto> {
    const existing = await this.unitOfWork.Expense.findById(id);
    if (!existing) throw new NotFoundError(`Expense with ID ${id} not found`);
    if (existing.storeCode !== storeCode) throw new ForbiddenError('That expense belongs to another store');
    return existing;
  }

  private async insert(
    data: ExpenseModel,
    storeCode: string,
    createdById: string,
    status: ExpenseStatus,
    templateId: number | null,
    transactionClient: Prisma.TransactionClient
  ): Promise<{ id: number }> {
    const money = await this.moneyFields(data, storeCode, transactionClient);
    const descriptive = await this.descriptiveFields(data, storeCode, transactionClient);
    const expenseNumber = await this.nextExpenseNumber(storeCode, data.isTemplate === true, transactionClient);

    if (status === ExpenseStatusEnum.Paid && !data.paidFromAccountId) {
      throw new ClientError('Choose the cash or bank account the money left from');
    }

    return transactionClient.expense.create({
      data: {
        expenseNumber,
        storeCode,
        ...descriptive,
        ...money,
        status,
        isTemplate: data.isTemplate === true,
        templateId,
        recurrenceInterval: data.isTemplate ? (data.recurrenceInterval ?? null) : null,
        recurrenceNextDate: data.isTemplate && data.recurrenceNextDate ? new Date(data.recurrenceNextDate) : null,
        recurrenceEndDate: data.isTemplate && data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
        ...(status === ExpenseStatusEnum.Approved || status === ExpenseStatusEnum.Paid
          ? { approvedById: createdById, approvedAt: new Date() }
          : {}),
        ...(status === ExpenseStatusEnum.Paid && { paidAt: data.expenseDate ? new Date(data.expenseDate) : new Date() }),
        createdById,
      },
      select: { id: true },
    });
  }

  /** The fields that describe the expense rather than its money, editable at any point. */
  private async descriptiveFields(data: ExpenseModel, storeCode: string, transactionClient: Prisma.TransactionClient) {
    if (data.supplierId) {
      const supplier = await transactionClient.supplier.findFirst({ where: { id: data.supplierId, storeCode }, select: { id: true } });
      if (!supplier) throw new NotFoundError('That supplier was not found in this store');
    }

    return {
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      supplierId: data.supplierId ?? null,
      partyType: data.supplierId ? PartyTypeEnum.Supplier : (data.partyType ?? null),
      partyId: data.supplierId ? String(data.supplierId) : (data.partyId ?? null),
      referenceNumber: data.referenceNumber ?? null,
      notes: data.notes ?? null,
      attachments: data.attachments ?? [],
      isInterState: data.isInterState === true,
    };
  }

  /**
   * The money, recomputed here rather than trusted from the client, with the tax rate and name
   * snapshotted onto the row so a later rate change never rewrites a posted expense - the same
   * rule the estimate pipeline follows.
   */
  private async moneyFields(data: ExpenseModel, storeCode: string, transactionClient: Prisma.TransactionClient) {
    const account = await requireCounterAccount(data.expenseAccountId, storeCode, transactionClient);
    const full = await transactionClient.ledgerAccount.findUnique({
      where: { storeCode_id: { storeCode, id: account.id } },
      select: { category: true, name: true },
    });
    if (full?.category !== 'EXPENSE') {
      throw new ClientError(`"${full?.name ?? account.name}" is not an expense account, so a cost cannot be booked to it`);
    }

    let taxName: string | null = null;
    let taxRate = 0;
    if (data.taxId) {
      const tax = await transactionClient.tax.findUnique({ where: { id: data.taxId }, select: { name: true, rate: true, category: true } });
      if (!tax) throw new NotFoundError('That tax was not found');
      taxName = tax.name;
      taxRate = tax.category === TaxCategoryEnum.Taxable ? tax.rate.toNumber() : 0;
    }

    const taxType: TaxType | null = data.taxType ?? (taxRate > 0 ? TaxTypeEnum.WithTax : null);
    const totals = computeExpenseTotals({ amount: data.amount, taxRate, taxType, isInterState: data.isInterState === true });

    if (data.paidFromAccountId) await requireMoneyAccount(data.paidFromAccountId, storeCode, transactionClient);

    return {
      expenseAccountId: data.expenseAccountId,
      paidFromAccountId: data.paidFromAccountId ?? null,
      amount: totals.amount,
      taxId: data.taxId ?? null,
      taxName,
      taxRate,
      taxType,
      taxableAmount: totals.taxableAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
    };
  }

  /** The same arithmetic without touching the database, for the frozen-amount check. */
  private resolveTotalsFromModel(data: ExpenseModel, taxRate: number, taxType: TaxType | null) {
    return computeExpenseTotals({ amount: data.amount, taxRate, taxType, isInterState: data.isInterState === true });
  }

  /**
   * Recognising the cost. The credit side is whatever the money came from: a cash or bank
   * account when the expense is paid outright, Accounts Payable when it is merely approved -
   * which is what makes an unpaid expense show up as a liability rather than vanish.
   */
  private async postExpense(
    id: number,
    storeCode: string,
    createdById: string,
    transactionClient: Prisma.TransactionClient
  ): Promise<number | null> {
    const expense = await transactionClient.expense.findUnique({
      where: { id },
      select: {
        id: true,
        expenseNumber: true,
        expenseDate: true,
        expenseAccountId: true,
        paidFromAccountId: true,
        status: true,
        taxableAmount: true,
        taxAmount: true,
        isInterState: true,
        referenceNumber: true,
        partyType: true,
        partyId: true,
        expenseAccount: { select: { name: true } },
      },
    });
    if (!expense) return null;

    const taxAccounts = await this.taxInputAccounts(storeCode, transactionClient);
    const payableAccountId = expense.paidFromAccountId ?? (await this.payableAccountId(storeCode, transactionClient));
    if (payableAccountId == null) {
      logger.warn('Skipped expense posting: no Accounts Payable account to credit', { storeCode, expenseId: id });
      return null;
    }

    const lines = buildExpenseLines({
      expenseAccountId: expense.expenseAccountId,
      taxableAmount: expense.taxableAmount.toNumber(),
      taxAmount: expense.taxAmount.toNumber(),
      isInterState: expense.isInterState,
      cgstInputAccountId: taxAccounts.cgst,
      sgstInputAccountId: taxAccounts.sgst,
      igstInputAccountId: taxAccounts.igst,
      creditAccountId: payableAccountId,
    });

    return this.postingService.postMoneyMovement(
      {
        storeCode,
        createdById,
        voucherType: VoucherTypeEnum.Expense,
        entryDate: expense.expenseDate,
        narration: `${expense.expenseAccount?.name ?? 'Expense'} - ${expense.expenseNumber}`,
        referenceNumber: expense.referenceNumber,
        sourceType: SOURCE.expense,
        sourceId: expense.id,
        lines,
        party: expense.partyType && expense.partyId ? { partyType: expense.partyType, partyId: expense.partyId } : null,
        // Only the payable carries the party; tagging the cost or the GST too would make a
        // "everything for this supplier" view count the same bill twice.
        partyAccountIds: expense.paidFromAccountId ? [] : [payableAccountId],
      },
      transactionClient
    );
  }

  /** Settling a payable that an earlier approval created: the money leaves, the liability goes. */
  private async postExpenseSettlement(
    id: number,
    storeCode: string,
    createdById: string,
    paymentDate: Date,
    transactionClient: Prisma.TransactionClient
  ): Promise<number | null> {
    const expense = await transactionClient.expense.findUnique({
      where: { id },
      select: {
        id: true,
        expenseNumber: true,
        paidFromAccountId: true,
        totalAmount: true,
        referenceNumber: true,
        partyType: true,
        partyId: true,
      },
    });
    if (!expense?.paidFromAccountId) return null;

    const payableAccountId = await this.payableAccountId(storeCode, transactionClient);
    if (payableAccountId == null) {
      logger.warn('Skipped expense settlement posting: no Accounts Payable account to debit', { storeCode, expenseId: id });
      return null;
    }

    const amount = expense.totalAmount.toNumber();
    const lines = [
      { ledgerAccountId: payableAccountId, debit: amount, credit: 0 },
      { ledgerAccountId: expense.paidFromAccountId, debit: 0, credit: amount },
    ];

    return this.postingService.postMoneyMovement(
      {
        storeCode,
        createdById,
        voucherType: VoucherTypeEnum.Payment,
        entryDate: paymentDate,
        narration: `Paid ${expense.expenseNumber}`,
        referenceNumber: expense.referenceNumber,
        sourceType: SOURCE.expensePayment,
        sourceId: expense.id,
        lines,
        party: expense.partyType && expense.partyId ? { partyType: expense.partyType, partyId: expense.partyId } : null,
        partyAccountIds: [payableAccountId],
      },
      transactionClient
    );
  }

  private async taxInputAccounts(storeCode: string, transactionClient: Prisma.TransactionClient) {
    const accounts = await transactionClient.ledgerAccount.findMany({
      where: { storeCode, systemKey: { in: ['CGST_INPUT', 'SGST_INPUT', 'IGST_INPUT'] }, isActive: true, status: { not: 'Trash' } },
      select: { id: true, systemKey: true },
    });
    const byKey = new Map(accounts.map((account) => [account.systemKey, account.id] as const));
    return { cgst: byKey.get('CGST_INPUT') ?? null, sgst: byKey.get('SGST_INPUT') ?? null, igst: byKey.get('IGST_INPUT') ?? null };
  }

  private async payableAccountId(storeCode: string, transactionClient: Prisma.TransactionClient): Promise<number | null> {
    const account = await transactionClient.ledgerAccount.findFirst({
      where: { storeCode, systemKey: 'ACCOUNTS_PAYABLE', isActive: true, status: { not: 'Trash' } },
      select: { id: true },
    });
    return account?.id ?? null;
  }

  private async nextExpenseNumber(storeCode: string, isTemplate: boolean, transactionClient: Prisma.TransactionClient): Promise<string> {
    const prefix = isTemplate ? 'EXR' : 'EXP';
    const last = await transactionClient.expense.findFirst({
      where: { storeCode, expenseNumber: { startsWith: `${prefix}-` } },
      orderBy: { id: 'desc' },
      select: { expenseNumber: true },
    });
    const lastSequence = last ? Number(last.expenseNumber.match(/(\d+)$/)?.[1] ?? 0) : 0;
    return `${prefix}-${String(lastSequence + 1).padStart(4, '0')}`;
  }

  /**
   * Month-based intervals land on the same day of the next period, clamped to the month end so
   * a rent due on the 31st does not skip February.
   */
  private advance(from: Date, interval: string | null | undefined): Date {
    if (interval === RecurrenceIntervalEnum.Weekly) {
      const next = new Date(from);
      next.setDate(next.getDate() + 7);
      return next;
    }

    const months = MONTHS_BY_INTERVAL[interval ?? RecurrenceIntervalEnum.Monthly] ?? 1;
    const target = new Date(from);
    const dayOfMonth = target.getDate();
    target.setDate(1);
    target.setMonth(target.getMonth() + months);
    const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(dayOfMonth, lastDayOfTargetMonth));
    return target;
  }
}
