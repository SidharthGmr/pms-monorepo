import {
  ACCOUNT_NATURE,
  computeRunningBalance,
  LedgerAccountDto,
  LedgerAccountFilterParams,
  LedgerAccountTreeDto,
  LedgerStatementDto,
  LedgerStatementFilterParams,
  ListResponseDto,
  signedMovement,
  TrialBalanceDto,
} from '@pms/types';
import { JournalStatus, PartyType as PrismaPartyType, Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { ILedgerAccountRepository } from './interfaces/iledger-account.repository';

const SORTABLE_COLUMNS = new Set(['code', 'name', 'category', 'subType', 'displayOrder', 'createdAt', 'updatedAt', 'id']);

const round2 = (value: number) => Math.round(value * 100) / 100;

// Exported because the service writes through `transactionClient` rather than this repository,
// and those calls have to return the same shape.
export const ledgerAccountSelect = {
  id: true,
  code: true,
  name: true,
  category: true,
  subType: true,
  parentId: true,
  description: true,
  isSystem: true,
  systemKey: true,
  isActive: true,
  status: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
  storeCode: false,
  parent: { select: { name: true } },
  _count: { select: { children: true } },
} satisfies Prisma.ledgerAccountSelect;

type LedgerAccountRow = Prisma.ledgerAccountGetPayload<{ select: typeof ledgerAccountSelect }>;

export const toLedgerAccountDto = (row: LedgerAccountRow): LedgerAccountDto => ({
  id: row.id,
  code: row.code,
  name: row.name,
  category: row.category,
  subType: row.subType,
  parentId: row.parentId,
  parentName: row.parent?.name ?? null,
  description: row.description,
  isSystem: row.isSystem,
  systemKey: row.systemKey,
  isActive: row.isActive,
  status: row.status,
  displayOrder: row.displayOrder,
  hasChildren: row._count.children > 0,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class LedgerAccountRepository implements ILedgerAccountRepository {
  async findAll(
    filters?: LedgerAccountFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'code',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<ListResponseDto<LedgerAccountDto>> {
    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'code';
    const direction: Prisma.SortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
    const where: Prisma.ledgerAccountWhereInput = {};

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.category) where.category = filters.category as Prisma.EnumAccountCategoryFilter;
      if (filters.subType) where.subType = filters.subType as Prisma.EnumAccountSubTypeFilter;
      if (filters.parentId !== undefined) where.parentId = filters.parentId;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.postableOnly) where.children = { none: { status: { not: Status.Trash } } };
      if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;
    }

    if (filters?.status != null) {
      where.status = filters.status as Status;
    } else {
      where.NOT = { status: Status.Trash };
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const orderBy: Prisma.ledgerAccountOrderByWithRelationInput[] = [{ [column]: direction }, { id: 'asc' }];

    const [rows, total] = await Promise.all([
      prisma.ledgerAccount.findMany({
        where,
        orderBy,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        select: ledgerAccountSelect,
      }),
      prisma.ledgerAccount.count({ where }),
    ]);

    return { totalRecord: total, data: rows.map(toLedgerAccountDto) };
  }

  async findById(id: number, storeCode: string): Promise<LedgerAccountDto | null> {
    const row = await prisma.ledgerAccount.findUnique({ where: { storeCode_id: { storeCode, id } }, select: ledgerAccountSelect });
    return row ? toLedgerAccountDto(row) : null;
  }

  async delete(id: number, storeCode: string): Promise<LedgerAccountDto> {
    const row = await prisma.ledgerAccount.update({
      where: { storeCode_id: { storeCode, id } },
      data: { status: Status.Trash, isActive: false, updatedAt: new Date() },
      select: ledgerAccountSelect,
    });
    return toLedgerAccountDto(row);
  }

  // Built in memory from one ordered query: the chart is small per store, so recursing in SQL
  // would cost more than it saves.
  async findTree(storeCode: string): Promise<LedgerAccountTreeDto[]> {
    const rows = await prisma.ledgerAccount.findMany({
      where: { storeCode, NOT: { status: Status.Trash } },
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
      select: ledgerAccountSelect,
    });

    const nodes = new Map<number, LedgerAccountTreeDto>();
    for (const row of rows) nodes.set(row.id, { ...toLedgerAccountDto(row), children: [] });

    const roots: LedgerAccountTreeDto[] = [];
    for (const node of nodes.values()) {
      const parent = node.parentId != null ? nodes.get(node.parentId) : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    return roots;
  }

  async findByCode(code: string, storeCode: string): Promise<LedgerAccountDto | null> {
    const row = await prisma.ledgerAccount.findUnique({ where: { storeCode_code: { storeCode, code } }, select: ledgerAccountSelect });
    return row ? toLedgerAccountDto(row) : null;
  }

  async countLines(id: number, storeCode: string): Promise<number> {
    return prisma.journalLine.count({ where: { ledgerAccountId: id, storeCode } });
  }

  async countChildren(id: number, storeCode: string): Promise<number> {
    return prisma.ledgerAccount.count({ where: { parentId: id, storeCode, NOT: { status: Status.Trash } } });
  }

  /**
   * One account's statement. The opening balance is aggregated from every line before the
   * window rather than stored, so it can never drift from the journal; the running balance is
   * then carried forward through the window in the order the statement reads.
   */
  async statement(id: number, storeCode: string, filters?: LedgerStatementFilterParams): Promise<LedgerStatementDto | null> {
    const account = await prisma.ledgerAccount.findUnique({
      where: { storeCode_id: { storeCode, id } },
      select: { id: true, code: true, name: true, category: true, subType: true },
    });
    if (!account) return null;

    const partyWhere: Prisma.journalLineWhereInput = {};
    if (filters?.partyType) partyWhere.partyType = filters.partyType as PrismaPartyType;
    if (filters?.partyId) partyWhere.partyId = filters.partyId;

    const entryWhere: Prisma.journalEntryWhereInput = filters?.includeReversed ? {} : { status: JournalStatus.POSTED };
    const startDate = filters?.startDate ? new Date(filters.startDate as string) : null;
    const endDate = filters?.endDate ? new Date(filters.endDate as string) : null;

    const base: Prisma.journalLineWhereInput = { storeCode, ledgerAccountId: id, ...partyWhere, entry: entryWhere };

    const [openingAgg, lines] = await Promise.all([
      startDate
        ? prisma.journalLine.aggregate({
            where: { ...base, entry: { ...entryWhere, entryDate: { lt: startDate } } },
            _sum: { debit: true, credit: true },
          })
        : Promise.resolve(null),
      prisma.journalLine.findMany({
        where: {
          ...base,
          entry: {
            ...entryWhere,
            ...(startDate || endDate ? { entryDate: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) } } : {}),
          },
        },
        orderBy: [{ entry: { entryDate: 'asc' } }, { journalEntryId: 'asc' }, { lineOrder: 'asc' }],
        select: {
          id: true,
          journalEntryId: true,
          debit: true,
          credit: true,
          partyType: true,
          partyId: true,
          entry: {
            select: {
              voucherNumber: true,
              voucherType: true,
              entryDate: true,
              narration: true,
              referenceNumber: true,
              lines: { select: { ledgerAccountId: true, ledgerAccount: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);

    const nature = ACCOUNT_NATURE[account.category];
    const openingDebit = openingAgg?._sum.debit?.toNumber() ?? 0;
    const openingCredit = openingAgg?._sum.credit?.toNumber() ?? 0;
    const openingBalance = signedMovement(account.category, openingDebit, openingCredit);

    const movements = lines.map((line) => ({ ledgerAccountId: id, debit: line.debit.toNumber(), credit: line.credit.toNumber() }));
    const running = computeRunningBalance(openingBalance, account.category, movements);

    const rows = lines.map((line, index) => ({
      journalEntryId: line.journalEntryId,
      lineId: line.id,
      voucherNumber: line.entry.voucherNumber,
      voucherType: line.entry.voucherType,
      entryDate: line.entry.entryDate,
      narration: line.entry.narration,
      referenceNumber: line.entry.referenceNumber,
      contraAccounts: [
        ...new Set(line.entry.lines.filter((other) => other.ledgerAccountId !== id).map((other) => other.ledgerAccount.name)),
      ],
      partyType: line.partyType,
      partyId: line.partyId,
      debit: running.rows[index]!.debit,
      credit: running.rows[index]!.credit,
      balance: running.rows[index]!.balance,
    }));

    const partyName = filters?.partyId ? await this.resolvePartyName(filters.partyId) : null;

    return {
      accountId: account.id,
      code: account.code,
      name: account.name,
      category: account.category,
      subType: account.subType,
      nature,
      partyType: (filters?.partyType as LedgerStatementDto['partyType']) ?? null,
      partyId: filters?.partyId ?? null,
      partyName,
      startDate,
      endDate,
      openingBalance,
      totalDebit: running.totalDebit,
      totalCredit: running.totalCredit,
      closingBalance: running.closingBalance,
      rowCount: rows.length,
      rows,
    };
  }

  /**
   * Every account's net position, split into the two columns. The totals must foot: a
   * non-zero difference means something was posted out of balance, which is the one thing the
   * posting service is built to prevent, so it is surfaced rather than hidden.
   */
  async trialBalance(storeCode: string, filters?: LedgerStatementFilterParams): Promise<TrialBalanceDto> {
    const entryWhere: Prisma.journalEntryWhereInput = filters?.includeReversed ? {} : { status: JournalStatus.POSTED };
    const startDate = filters?.startDate ? new Date(filters.startDate as string) : null;
    const endDate = filters?.endDate ? new Date(filters.endDate as string) : null;

    const grouped = await prisma.journalLine.groupBy({
      by: ['ledgerAccountId'],
      where: {
        storeCode,
        entry: {
          ...entryWhere,
          ...(startDate || endDate ? { entryDate: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) } } : {}),
        },
      },
      _sum: { debit: true, credit: true },
    });

    const accounts = await prisma.ledgerAccount.findMany({
      where: { storeCode, id: { in: grouped.map((row) => row.ledgerAccountId) } },
      select: { id: true, code: true, name: true, category: true, subType: true },
    });
    const byId = new Map(accounts.map((account) => [account.id, account] as const));

    let totalDebit = 0;
    let totalCredit = 0;
    const rows = grouped
      .map((row) => {
        const account = byId.get(row.ledgerAccountId);
        if (!account) return null;
        const debitSum = row._sum.debit?.toNumber() ?? 0;
        const creditSum = row._sum.credit?.toNumber() ?? 0;
        const net = round2(debitSum - creditSum);
        const debit = net > 0 ? net : 0;
        const credit = net < 0 ? round2(-net) : 0;
        totalDebit = round2(totalDebit + debit);
        totalCredit = round2(totalCredit + credit);
        return { accountId: account.id, code: account.code, name: account.name, category: account.category, subType: account.subType, debit, credit };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null && (row.debit > 0 || row.credit > 0))
      .sort((a, b) => a.code.localeCompare(b.code));

    const difference = round2(totalDebit - totalCredit);
    return { startDate, endDate, rows, totalDebit, totalCredit, difference, isBalanced: difference === 0 };
  }

  /** A party id is a userId for a customer or staff member, and a supplier id otherwise. */
  private async resolvePartyName(partyId: string): Promise<string | null> {
    const user = await prisma.users.findUnique({ where: { userId: partyId }, select: { name: true } });
    if (user) return user.name;
    const supplierId = Number(partyId);
    if (!Number.isFinite(supplierId)) return null;
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId }, select: { name: true } });
    return supplier?.name ?? null;
  }
}
