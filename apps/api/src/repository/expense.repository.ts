import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import {
  ExpenseCategoryTotalDto,
  ExpenseDto,
  ExpenseFilterParams,
  ExpenseStatus,
  ExpenseStatusEnum,
  ExpenseSummaryDto,
  ExpenseSummaryParams,
  ListResponseDto,
} from '@pms/types';
import { IExpenseRepository } from './interfaces/iexpense.repository';

const SORTABLE_COLUMNS = new Set(['expenseNumber', 'expenseDate', 'totalAmount', 'status', 'createdAt', 'updatedAt', 'id']);

const expenseSelect = {
  id: true,
  expenseNumber: true,
  storeCode: true,
  expenseDate: true,
  expenseAccountId: true,
  paidFromAccountId: true,
  supplierId: true,
  partyType: true,
  partyId: true,
  referenceNumber: true,
  notes: true,
  status: true,
  amount: true,
  taxId: true,
  taxName: true,
  taxRate: true,
  taxType: true,
  taxableAmount: true,
  taxAmount: true,
  totalAmount: true,
  isInterState: true,
  attachments: true,
  isTemplate: true,
  templateId: true,
  recurrenceInterval: true,
  recurrenceNextDate: true,
  recurrenceEndDate: true,
  approvedById: true,
  approvedAt: true,
  paidAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  expenseAccount: { select: { code: true, name: true } },
  paidFromAccount: { select: { name: true } },
  supplier: { select: { name: true } },
  approvedBy: { select: { name: true } },
  createdBy: { select: { name: true } },
} satisfies Prisma.expenseSelect;

type ExpenseRow = Prisma.expenseGetPayload<{ select: typeof expenseSelect }>;

const toNumber = (value: Prisma.Decimal) => value.toNumber();
const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * The CGST/SGST split is not stored on the row - it is a presentation of one rate, exactly as
 * on an estimate - so it is derived here from the tax amount and the place of supply.
 */
function toDto(row: ExpenseRow, journal?: { id: number; voucherNumber: string } | null): ExpenseDto {
  const { expenseAccount, paidFromAccount, supplier, approvedBy, createdBy, ...rest } = row;
  const taxAmount = toNumber(row.taxAmount);
  const cgstAmount = row.isInterState ? 0 : round2(taxAmount / 2);

  return {
    ...rest,
    amount: toNumber(row.amount),
    taxRate: toNumber(row.taxRate),
    taxableAmount: toNumber(row.taxableAmount),
    cgstAmount,
    sgstAmount: row.isInterState ? 0 : round2(taxAmount - cgstAmount),
    igstAmount: row.isInterState ? taxAmount : 0,
    taxAmount,
    totalAmount: toNumber(row.totalAmount),
    expenseAccountCode: expenseAccount?.code ?? null,
    expenseAccountName: expenseAccount?.name ?? null,
    paidFromAccountName: paidFromAccount?.name ?? null,
    supplierName: supplier?.name ?? null,
    approvedByName: approvedBy?.name ?? null,
    createdByName: createdBy?.name ?? null,
    journalEntryId: journal?.id ?? null,
    journalVoucherNumber: journal?.voucherNumber ?? null,
  };
}

export class ExpenseRepository implements IExpenseRepository {
  async findAll(
    filters?: ExpenseFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'expenseDate',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<ExpenseDto>> {
    const where: Prisma.expenseWhereInput = { deletedAt: null, isTemplate: filters?.isTemplate === true };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [
          { expenseNumber: { contains: filters.search, mode: 'insensitive' } },
          { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } },
          { expenseAccount: { name: { contains: filters.search, mode: 'insensitive' } } },
          { supplier: { name: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }
      if (filters.status !== undefined) where.status = filters.status as ExpenseStatus;
      if (filters.expenseAccountId !== undefined) where.expenseAccountId = Number(filters.expenseAccountId);
      if (filters.supplierId !== undefined) where.supplierId = Number(filters.supplierId);
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
      if (filters.fromDate != null || filters.toDate != null) {
        where.expenseDate = {
          ...(filters.fromDate != null && { gte: new Date(filters.fromDate) }),
          ...(filters.toDate != null && { lte: new Date(filters.toDate) }),
        };
      }
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'expenseDate';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [rows, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        select: expenseSelect,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.expense.count({ where }),
    ]);

    return { totalRecord: total, data: await this.withVouchers(rows) };
  }

  /**
   * The posted voucher numbers for a page of expenses in one query rather than one per row -
   * the journal is the record of what was posted, so the number is read back from it, but a
   * list must not pay a query per line to show it.
   */
  private async withVouchers(rows: ExpenseRow[]): Promise<ExpenseDto[]> {
    if (rows.length === 0) return [];

    const entries = await prisma.journalEntry.findMany({
      where: { storeCode: { in: [...new Set(rows.map((row) => row.storeCode))] }, sourceType: 'expense', sourceId: { in: rows.map((row) => row.id) } },
      select: { id: true, voucherNumber: true, storeCode: true, sourceId: true },
    });
    const byKey = new Map(entries.map((entry) => [`${entry.storeCode}:${entry.sourceId}`, entry] as const));

    return rows.map((row) => toDto(row, byKey.get(`${row.storeCode}:${row.id}`) ?? null));
  }

  /**
   * One extra query for the posted voucher, which lives on the journal under this expense id
   * rather than on the expense itself - the journal is the record of what was posted, so the
   * number is read back from it instead of being cached here and left to drift.
   */
  async findById(id: number): Promise<ExpenseDto | null> {
    const row = await prisma.expense.findFirst({ where: { id, deletedAt: null }, select: expenseSelect });
    if (!row) return null;

    const journal = await prisma.journalEntry.findUnique({
      where: { storeCode_sourceType_sourceId: { storeCode: row.storeCode, sourceType: 'expense', sourceId: row.id } },
      select: { id: true, voucherNumber: true },
    });
    return toDto(row, journal);
  }

  async findDueTemplates(storeCode: string, onDate: Date): Promise<ExpenseDto[]> {
    const rows = await prisma.expense.findMany({
      where: {
        storeCode,
        isTemplate: true,
        deletedAt: null,
        status: { not: ExpenseStatusEnum.Cancelled },
        recurrenceNextDate: { lte: onDate },
        OR: [{ recurrenceEndDate: null }, { recurrenceEndDate: { gte: onDate } }],
      },
      select: expenseSelect,
      orderBy: { recurrenceNextDate: 'asc' },
    });
    return this.withVouchers(rows);
  }

  /**
   * Expense totals for the window, split by what the money is doing: paid is money already
   * gone, unpaid is an approved liability still owed, and draft is neither - nobody has
   * committed to it - so it is reported apart rather than added into either.
   */
  async summary(storeCode: string, filters?: ExpenseSummaryParams): Promise<ExpenseSummaryDto> {
    const now = new Date();
    const from = filters?.fromDate ? new Date(filters.fromDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = filters?.toDate ? new Date(filters.toDate) : now;

    const where: Prisma.expenseWhereInput = {
      storeCode,
      deletedAt: null,
      isTemplate: false,
      status: { not: ExpenseStatusEnum.Cancelled },
      expenseDate: { gte: from, lte: to },
    };

    const [byStatus, byAccount, accounts] = await Promise.all([
      prisma.expense.groupBy({ by: ['status'], where, _sum: { totalAmount: true, taxAmount: true } }),
      prisma.expense.groupBy({
        by: ['expenseAccountId'],
        where: { ...where, status: { in: [ExpenseStatusEnum.Approved, ExpenseStatusEnum.Paid] } },
        _sum: { totalAmount: true, taxAmount: true },
        _count: { _all: true },
      }),
      prisma.ledgerAccount.findMany({ where: { storeCode }, select: { id: true, code: true, name: true } }),
    ]);

    const accountById = new Map(accounts.map((account) => [account.id, account] as const));
    const totalFor = (status: ExpenseStatus) => round2(byStatus.find((row) => row.status === status)?._sum.totalAmount?.toNumber() ?? 0);

    const categories: ExpenseCategoryTotalDto[] = byAccount
      .map((row) => ({
        expenseAccountId: row.expenseAccountId,
        code: accountById.get(row.expenseAccountId)?.code ?? '',
        name: accountById.get(row.expenseAccountId)?.name ?? 'Unknown',
        total: round2(row._sum.totalAmount?.toNumber() ?? 0),
        taxAmount: round2(row._sum.taxAmount?.toNumber() ?? 0),
        count: row._count._all,
      }))
      .sort((a, b) => b.total - a.total);

    const taxTotal = byStatus
      .filter((row) => row.status !== ExpenseStatusEnum.Draft)
      .reduce((sum, row) => sum + (row._sum.taxAmount?.toNumber() ?? 0), 0);

    return {
      from,
      to,
      paidTotal: totalFor(ExpenseStatusEnum.Paid),
      unpaidTotal: totalFor(ExpenseStatusEnum.Approved),
      draftTotal: totalFor(ExpenseStatusEnum.Draft),
      taxTotal: round2(taxTotal),
      categories,
    };
  }

  async delete(id: number): Promise<ExpenseDto> {
    const row = await prisma.expense.update({ where: { id }, data: { deletedAt: new Date() }, select: expenseSelect });
    return toDto(row);
  }
}
