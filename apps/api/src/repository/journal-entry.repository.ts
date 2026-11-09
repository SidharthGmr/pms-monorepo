import {
  DayBookSummaryDto,
  DayBookVoucherTypeTotalDto,
  JournalEntryDto,
  JournalEntryFilterParams,
  JournalLineDto,
  ListResponseDto,
  VoucherType,
} from '@pms/types';
import { AccountSubType as PrismaAccountSubType, PartyType as PrismaPartyType, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { IJournalEntryRepository } from './interfaces/ijournal-entry.repository';

const SORTABLE_COLUMNS = new Set(['voucherNumber', 'voucherType', 'entryDate', 'totalDebit', 'status', 'createdAt', 'id']);

export const journalEntrySelect = {
  id: true,
  voucherNumber: true,
  voucherType: true,
  entryDate: true,
  narration: true,
  referenceNumber: true,
  sourceType: true,
  sourceId: true,
  financialYearId: true,
  status: true,
  reversesEntryId: true,
  reversedAt: true,
  totalDebit: true,
  totalCredit: true,
  isOpening: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  storeCode: false,
  financialYear: { select: { name: true } },
  createdBy: { select: { name: true } },
  reversesEntry: { select: { voucherNumber: true } },
  reversedByEntry: { select: { id: true, voucherNumber: true } },
  lines: {
    orderBy: { lineOrder: 'asc' },
    select: {
      id: true,
      ledgerAccountId: true,
      debit: true,
      credit: true,
      narration: true,
      partyType: true,
      partyId: true,
      lineOrder: true,
      ledgerAccount: { select: { code: true, name: true, category: true, subType: true } },
    },
  },
} satisfies Prisma.journalEntrySelect;

type JournalEntryRow = Prisma.journalEntryGetPayload<{ select: typeof journalEntrySelect }>;

const toLineDto = (line: JournalEntryRow['lines'][number]): JournalLineDto => ({
  id: line.id,
  ledgerAccountId: line.ledgerAccountId,
  accountCode: line.ledgerAccount.code,
  accountName: line.ledgerAccount.name,
  accountCategory: line.ledgerAccount.category,
  accountSubType: line.ledgerAccount.subType,
  debit: line.debit.toNumber(),
  credit: line.credit.toNumber(),
  narration: line.narration,
  partyType: line.partyType,
  partyId: line.partyId,
  lineOrder: line.lineOrder,
});

export const toJournalEntryDto = (row: JournalEntryRow): JournalEntryDto => ({
  id: row.id,
  voucherNumber: row.voucherNumber,
  voucherType: row.voucherType,
  entryDate: row.entryDate,
  narration: row.narration,
  referenceNumber: row.referenceNumber,
  sourceType: row.sourceType,
  sourceId: row.sourceId,
  financialYearId: row.financialYearId,
  financialYearName: row.financialYear?.name ?? null,
  status: row.status,
  reversesEntryId: row.reversesEntryId,
  reversesVoucherNumber: row.reversesEntry?.voucherNumber ?? null,
  reversedByEntryId: row.reversedByEntry?.id ?? null,
  reversedByVoucherNumber: row.reversedByEntry?.voucherNumber ?? null,
  reversedAt: row.reversedAt,
  totalDebit: row.totalDebit.toNumber(),
  totalCredit: row.totalCredit.toNumber(),
  isOpening: row.isOpening,
  createdById: row.createdById,
  createdByName: row.createdBy?.name ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  lines: row.lines.map(toLineDto),
});

/**
 * The filter both the Day Book table and its totals are built from. They have to share it:
 * totals describing a different set of rows than the table shows are worse than no totals.
 */
const buildEntryWhere = (filters?: JournalEntryFilterParams): Prisma.journalEntryWhereInput => {
  const where: Prisma.journalEntryWhereInput = {};
  if (!filters) return where;

  if (filters.search) {
    where.OR = [
      { voucherNumber: { contains: filters.search, mode: 'insensitive' } },
      { narration: { contains: filters.search, mode: 'insensitive' } },
      { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.voucherType) where.voucherType = filters.voucherType as Prisma.EnumVoucherTypeFilter;
  if (filters.journalStatus) where.status = filters.journalStatus as Prisma.EnumJournalStatusFilter;
  if (filters.financialYearId !== undefined) where.financialYearId = filters.financialYearId;
  if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;

  // One `lines: { some }` carries every line-level filter together, so asking for an account
  // and a party means the same line matched both, not two different lines.
  const lineFilter: Prisma.journalLineWhereInput = {};
  if (filters.ledgerAccountId !== undefined) lineFilter.ledgerAccountId = filters.ledgerAccountId;
  if (filters.partyType) lineFilter.partyType = filters.partyType as PrismaPartyType;
  if (filters.partyId) lineFilter.partyId = filters.partyId;
  if (Object.keys(lineFilter).length > 0) where.lines = { some: lineFilter };

  if (filters.startDate || filters.endDate) {
    where.entryDate = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate) }),
    };
  }

  return where;
};

/** The day a timestamp belongs to, in the same local reckoning the web sends its range in. */
const localDateKey = (value: Date): string => {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const MONEY_ACCOUNT_SUB_TYPES: PrismaAccountSubType[] = [PrismaAccountSubType.CASH, PrismaAccountSubType.BANK];

export class JournalEntryRepository implements IJournalEntryRepository {
  async findAll(
    filters?: JournalEntryFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'entryDate',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<JournalEntryDto>> {
    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'entryDate';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const where = buildEntryWhere(filters);

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const orderBy: Prisma.journalEntryOrderByWithRelationInput[] = [{ [column]: direction }, { id: 'desc' }];

    const [rows, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        select: journalEntrySelect,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return { totalRecord: total, data: rows.map(toJournalEntryDto) };
  }

  async findById(id: number, storeCode: string): Promise<JournalEntryDto | null> {
    const row = await prisma.journalEntry.findFirst({ where: { id, storeCode }, select: journalEntrySelect });
    return row ? toJournalEntryDto(row) : null;
  }

  async findBySource(sourceType: string, sourceId: number, storeCode: string): Promise<JournalEntryDto | null> {
    const row = await prisma.journalEntry.findUnique({
      where: { storeCode_sourceType_sourceId: { storeCode, sourceType, sourceId } },
      select: journalEntrySelect,
    });
    return row ? toJournalEntryDto(row) : null;
  }

  /**
   * Totals for whatever the Day Book is currently showing. Journal movement and cash flow are
   * two different questions, so they are two different queries: the first sums every voucher,
   * the second sums only the lines that actually touched a cash or bank account.
   */
  async daySummary(filters: JournalEntryFilterParams): Promise<DayBookSummaryDto> {
    const where = buildEntryWhere(filters);

    const [entries, money] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: [{ entryDate: 'asc' }],
        select: { entryDate: true, voucherType: true, totalDebit: true, totalCredit: true },
      }),
      prisma.journalLine.aggregate({
        where: { entry: where, ledgerAccount: { subType: { in: MONEY_ACCOUNT_SUB_TYPES } } },
        _sum: { debit: true, credit: true },
      }),
    ]);

    const byDayMap = new Map<string, { date: string; totalDebit: number; totalCredit: number; voucherCount: number }>();
    const byTypeMap = new Map<VoucherType, DayBookVoucherTypeTotalDto>();
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      const debit = entry.totalDebit.toNumber();
      const credit = entry.totalCredit.toNumber();
      totalDebit = round2(totalDebit + debit);
      totalCredit = round2(totalCredit + credit);

      const key = localDateKey(entry.entryDate);
      const day = byDayMap.get(key) ?? { date: key, totalDebit: 0, totalCredit: 0, voucherCount: 0 };
      day.totalDebit = round2(day.totalDebit + debit);
      day.totalCredit = round2(day.totalCredit + credit);
      day.voucherCount += 1;
      byDayMap.set(key, day);

      const type = byTypeMap.get(entry.voucherType) ?? { voucherType: entry.voucherType, totalDebit: 0, totalCredit: 0, voucherCount: 0 };
      type.totalDebit = round2(type.totalDebit + debit);
      type.totalCredit = round2(type.totalCredit + credit);
      type.voucherCount += 1;
      byTypeMap.set(entry.voucherType, type);
    }

    const cashIn = round2(money._sum.debit?.toNumber() ?? 0);
    const cashOut = round2(money._sum.credit?.toNumber() ?? 0);

    return {
      totalDebit,
      totalCredit,
      voucherCount: entries.length,
      cashIn,
      cashOut,
      netCashMovement: round2(cashIn - cashOut),
      byDay: [...byDayMap.values()],
      byVoucherType: [...byTypeMap.values()].sort((a, b) => b.totalDebit - a.totalDebit),
    };
  }
}
