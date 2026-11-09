import { inject, injectable } from 'inversify';
import { Prisma } from '@prisma/client';
import { TYPES } from '../config/ioc.types';
import {
  computeJournalTotals,
  DayBookSummaryDto,
  JournalEntryDto,
  JournalEntryFilterParams,
  JournalEntryModel,
  JournalStatusEnum,
  ListResponseDto,
  reverseLines,
  ReverseJournalEntryModel,
  StatusEnum,
  validateJournalLines,
  VOUCHER_TYPE_PREFIXES,
  VoucherType,
  VoucherTypeEnum,
} from '@pms/types';
import ClientError from '../exceptions/client-error';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IJournalEntryService, PostingRequest } from './interfaces/Ijournal-entry.service';

@injectable()
export class JournalEntryService implements IJournalEntryService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async create(data: JournalEntryModel, storeCode: string, createdById: string): Promise<JournalEntryDto> {
    const entryDate = data.entryDate ? new Date(data.entryDate) : new Date();
    if (Number.isNaN(entryDate.getTime())) throw new ClientError('Enter a valid entry date');

    const entryId = await this.unitOfWork.transaction(async (transactionClient) => {
      return this.post(
        {
          storeCode,
          createdById,
          voucherType: data.voucherType ?? VoucherTypeEnum.Journal,
          entryDate,
          narration: data.narration ?? null,
          referenceNumber: data.referenceNumber ?? null,
          isOpening: data.voucherType === VoucherTypeEnum.Opening,
          lines: data.lines,
        },
        transactionClient
      );
    });

    const entry = await this.unitOfWork.JournalEntry.findById(entryId, storeCode);
    return entry!;
  }

  async getAll(filters?: JournalEntryFilterParams): Promise<ListResponseDto<JournalEntryDto>> {
    const sortOrder = filters?.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return this.unitOfWork.JournalEntry.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, sortOrder);
  }

  async getById(id: number, storeCode: string): Promise<JournalEntryDto | null> {
    const entry = await this.unitOfWork.JournalEntry.findById(id, storeCode);
    if (!entry) throw new NotFoundError('Journal entry not found');
    return entry;
  }

  async getDaySummary(filters: JournalEntryFilterParams): Promise<DayBookSummaryDto> {
    return this.unitOfWork.JournalEntry.daySummary(filters);
  }

  async reverse(id: number, data: ReverseJournalEntryModel, storeCode: string, createdById: string): Promise<JournalEntryDto> {
    const existing = await this.unitOfWork.JournalEntry.findById(id, storeCode);
    if (!existing) throw new NotFoundError('Journal entry not found');
    if (existing.status === JournalStatusEnum.Reversed) throw new ClientError('This entry has already been reversed');
    if (existing.reversesEntryId != null) throw new ClientError('A reversal cannot itself be reversed');

    const entryDate = data.entryDate ? new Date(data.entryDate) : new Date();
    if (Number.isNaN(entryDate.getTime())) throw new ClientError('Enter a valid entry date');

    const reversalId = await this.unitOfWork.transaction(async (transactionClient) => {
      const newId = await this.post(
        {
          storeCode,
          createdById,
          voucherType: existing.voucherType,
          entryDate,
          narration: data.narration ?? `Reversal of ${existing.voucherNumber}`,
          referenceNumber: existing.voucherNumber,
          lines: reverseLines(existing.lines),
        },
        transactionClient,
        { reversesEntryId: existing.id }
      );

      await transactionClient.journalEntry.update({
        where: { id: existing.id },
        data: { status: JournalStatusEnum.Reversed, reversedAt: new Date() },
      });

      return newId;
    });

    const reversal = await this.unitOfWork.JournalEntry.findById(reversalId, storeCode);
    return reversal!;
  }

  /**
   * The only way a voucher reaches the database. Everything a posting rule could get wrong is
   * checked here rather than at the caller, so a rule added later cannot bypass the rules:
   * the lines must balance, every account must be a live leaf in the same store, and the
   * financial year the date falls in must still be open.
   *
   * Runs on the caller's transaction client on purpose - a sale and its voucher commit
   * together or not at all.
   */
  async post(request: PostingRequest, transactionClient: Prisma.TransactionClient, options?: { reversesEntryId?: number }): Promise<number> {
    const errors = validateJournalLines(request.lines);
    if (errors.length > 0) throw new ClientError(errors[0]!);

    await this.assertPostableAccounts(request, transactionClient);
    const financialYearId = await this.resolveFinancialYear(request, transactionClient);

    const totals = computeJournalTotals(request.lines);
    const voucherType = request.voucherType ?? VoucherTypeEnum.Journal;

    // Serialises numbering for this store and voucher type until the transaction ends, so two
    // concurrent posts cannot read the same last number. Retrying a duplicate is not an option
    // here: this runs on the caller's transaction, and Postgres aborts the whole transaction
    // on a unique violation, so every later statement - including the retry - fails and takes
    // the sale down with the voucher.
    const lockKey = `journal:${request.storeCode}:${voucherType}`;
    // $executeRaw, not $queryRaw: the function returns void, and $queryRaw cannot deserialize
    // a void column - it throws, and because this runs inside the sale's transaction it would
    // take every sale down with it.
    await transactionClient.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const voucherNumber = await this.nextVoucherNumber(request.storeCode, voucherType, transactionClient);

    let created: { id: number };
    try {
      created = await transactionClient.journalEntry.create({
        data: {
          storeCode: request.storeCode,
          voucherNumber,
          voucherType,
          entryDate: request.entryDate,
          narration: request.narration ?? null,
          referenceNumber: request.referenceNumber ?? null,
          sourceType: request.sourceType ?? null,
          sourceId: request.sourceId ?? null,
          financialYearId,
          reversesEntryId: options?.reversesEntryId ?? null,
          totalDebit: totals.totalDebit,
          totalCredit: totals.totalCredit,
          isOpening: request.isOpening ?? false,
          createdById: request.createdById,
          lines: {
            createMany: {
              data: request.lines.map((line, index) => ({
                storeCode: request.storeCode,
                ledgerAccountId: line.ledgerAccountId,
                debit: Math.max(Number(line.debit) || 0, 0),
                credit: Math.max(Number(line.credit) || 0, 0),
                narration: line.narration ?? null,
                partyType: (line.partyType as Prisma.journalLineCreateManyEntryInput['partyType']) ?? null,
                partyId: line.partyId ?? null,
                lineOrder: index,
              })),
            },
          },
        },
        select: { id: true },
      });
    } catch (error) {
      // A clash on the source key means the document already has an entry - the double-post
      // guard doing its job, reported as a plain 400 rather than a 500.
      const isDuplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      const target = isDuplicate ? String((error.meta as { target?: string[] } | undefined)?.target ?? '') : '';
      if (isDuplicate && target.includes('sourceType')) {
        throw new ClientError('This document has already been posted to the journal');
      }
      throw error;
    }

    await transactionClient.accountingAuditLog.create({
      data: {
        storeCode: request.storeCode,
        action: options?.reversesEntryId ? 'JOURNAL_REVERSED' : 'JOURNAL_POSTED',
        entityType: 'journalEntry',
        entityId: created.id,
        summary: `${voucherType} voucher posted for ${totals.totalDebit.toFixed(2)}`,
        detail: {
          voucherType,
          totalDebit: totals.totalDebit,
          totalCredit: totals.totalCredit,
          sourceType: request.sourceType ?? null,
          sourceId: request.sourceId ?? null,
          reversesEntryId: options?.reversesEntryId ?? null,
        },
        performedById: request.createdById,
      },
    });

    return created.id;
  }

  async resolveAccountIds(storeCode: string, systemKeys: string[], transactionClient: Prisma.TransactionClient): Promise<Map<string, number>> {
    const accounts = await transactionClient.ledgerAccount.findMany({
      where: { storeCode, systemKey: { in: systemKeys }, status: { not: StatusEnum.Trash } },
      select: { id: true, systemKey: true },
    });

    const byKey = new Map(accounts.filter((account) => account.systemKey != null).map((account) => [account.systemKey!, account.id] as const));
    const missing = systemKeys.filter((key) => !byKey.has(key));
    if (missing.length > 0) {
      throw new ClientError(`This store's chart of accounts is missing ${missing.join(', ')}. Set up the chart of accounts first.`);
    }
    return byKey;
  }

  private async assertPostableAccounts(request: PostingRequest, transactionClient: Prisma.TransactionClient): Promise<void> {
    const ids = [...new Set(request.lines.map((line) => line.ledgerAccountId))];
    const accounts = await transactionClient.ledgerAccount.findMany({
      where: { id: { in: ids }, storeCode: request.storeCode },
      select: { id: true, name: true, isActive: true, status: true, _count: { select: { children: { where: { status: { not: StatusEnum.Trash } } } } } },
    });

    const byId = new Map(accounts.map((account) => [account.id, account] as const));
    for (const id of ids) {
      const account = byId.get(id);
      if (!account || account.status === StatusEnum.Trash) throw new NotFoundError(`Ledger account ${id} not found`);
      if (!account.isActive) throw new ClientError(`"${account.name}" is inactive, so it cannot take a posting`);
      if (account._count.children > 0) {
        throw new ClientError(`"${account.name}" is a group heading; post to one of the accounts under it instead`);
      }
    }
  }

  private async resolveFinancialYear(request: PostingRequest, transactionClient: Prisma.TransactionClient): Promise<number | null> {
    const year = await transactionClient.financialYear.findFirst({
      where: { storeCode: request.storeCode, startDate: { lte: request.entryDate }, endDate: { gte: request.entryDate } },
      select: { id: true, name: true, isClosed: true },
    });

    if (!year) return null;
    if (year.isClosed) throw new ClientError(`The financial year ${year.name} is closed, so nothing can be posted into it`);
    return year.id;
  }

  private async nextVoucherNumber(storeCode: string, voucherType: VoucherType, transactionClient: Prisma.TransactionClient): Promise<string> {
    const prefix = VOUCHER_TYPE_PREFIXES[voucherType];
    const last = await transactionClient.journalEntry.findFirst({
      where: { storeCode, voucherType },
      orderBy: { id: 'desc' },
      select: { voucherNumber: true },
    });

    const lastSequence = last ? Number(last.voucherNumber.match(/(\d+)$/)?.[1] ?? 0) : 0;
    return `${prefix}-${String(lastSequence + 1).padStart(5, '0')}`;
  }
}
