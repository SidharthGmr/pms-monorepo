import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import {
  ACCOUNT_CATEGORY_LABELS,
  AccountSubTypeEnum,
  DEFAULT_CHART_OF_ACCOUNTS,
  LedgerAccountDto,
  LedgerAccountFilterParams,
  LedgerAccountModel,
  LedgerAccountTreeDto,
  LedgerStatementDto,
  LedgerStatementFilterParams,
  ListResponseDto,
  TrialBalanceDto,
  StatusEnum,
} from '@pms/types';
import ClientError from '../exceptions/client-error';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { ledgerAccountSelect, toLedgerAccountDto } from '../repository/ledger-account.repository';
import { ILedgerAccountService } from './interfaces/Iledger-account.service';

@injectable()
export class LedgerAccountService implements ILedgerAccountService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async create(data: LedgerAccountModel, storeCode: string, createdById: string): Promise<LedgerAccountDto> {
    const parentId = await this.resolveParent(data, storeCode);

    const ledgerAccountData = await this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.ledgerAccount.create({
        data: {
          storeCode,
          code: data.code.trim(),
          name: data.name.trim(),
          category: data.category,
          subType: data.subType ?? AccountSubTypeEnum.Other,
          parentId,
          description: data.description ?? null,
          isActive: data.isActive ?? true,
          status: data.status ?? StatusEnum.Published,
          displayOrder: data.displayOrder ?? 0,
          createdById,
        },
        select: ledgerAccountSelect,
      });
    });

    return toLedgerAccountDto(ledgerAccountData);
  }

  async getAll(filters?: LedgerAccountFilterParams): Promise<ListResponseDto<LedgerAccountDto>> {
    const sortOrder = filters?.sortDirection?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    return this.unitOfWork.LedgerAccount.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, sortOrder);
  }

  async getById(id: number, storeCode: string): Promise<LedgerAccountDto | null> {
    return this.findInStore(id, storeCode);
  }

  async update(id: number, data: LedgerAccountModel, storeCode: string, updatedById: string): Promise<LedgerAccountDto> {
    const existing = await this.findInStore(id, storeCode);

    // A system account is what posting rules resolve by key, so its identity is frozen; only
    // the parts a user can safely re-label stay editable.
    if (existing.isSystem) {
      if (data.code.trim() !== existing.code) throw new ClientError('The code of a system account cannot be changed');
      if (data.category !== existing.category) throw new ClientError('The category of a system account cannot be changed');
    }

    // An account a posting rule reaches for by key has to stay postable. Without this, hiding
    // one here would bypass the delete guard and stop every sale: an inactive account is
    // refused a posting, and a trashed one stops resolving at all.
    if (existing.systemKey) {
      if (data.isActive === false) throw new ClientError(`"${existing.name}" is used for automatic posting, so it cannot be deactivated`);
      if (data.status === StatusEnum.Trash) throw new ClientError(`"${existing.name}" is used for automatic posting, so it cannot be moved to Trash`);
    }

    const parentId = await this.resolveParent(data, storeCode, id);

    const ledgerAccountData = await this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.ledgerAccount.update({
        where: { storeCode_id: { storeCode, id } },
        data: {
          code: data.code.trim(),
          name: data.name.trim(),
          category: data.category,
          subType: data.subType ?? existing.subType,
          parentId,
          description: data.description ?? null,
          isActive: data.isActive ?? existing.isActive,
          status: data.status ?? existing.status,
          displayOrder: data.displayOrder ?? existing.displayOrder,
          updatedById,
          updatedAt: new Date(),
        },
        select: ledgerAccountSelect,
      });
    });

    return toLedgerAccountDto(ledgerAccountData);
  }

  async delete(id: number, storeCode: string): Promise<LedgerAccountDto> {
    const existing = await this.findInStore(id, storeCode);
    if (existing.isSystem) throw new ClientError('A system account cannot be deleted');

    const [lineCount, childCount] = await Promise.all([
      this.unitOfWork.LedgerAccount.countLines(id, storeCode),
      this.unitOfWork.LedgerAccount.countChildren(id, storeCode),
    ]);
    if (lineCount > 0) throw new ClientError('This account already has postings, so it cannot be deleted');
    if (childCount > 0) throw new ClientError('Move or delete the accounts under this one first');

    return this.unitOfWork.LedgerAccount.delete(id, storeCode);
  }

  async getTree(storeCode: string): Promise<LedgerAccountTreeDto[]> {
    return this.unitOfWork.LedgerAccount.findTree(storeCode);
  }

  /**
   * Idempotent: an account whose code already exists is left exactly as it is, so re-running
   * this never overwrites a chart a store has already adjusted.
   *
   * Written as one createMany plus one updateMany per parent rather than a row at a time.
   * Inserting the defaults individually is one sequential round trip each, which against a
   * remote database overruns the interactive transaction timeout and rolls the whole seed
   * back. Parents are stitched in a second pass because a child needs its parent's generated
   * id, and there are only a handful of distinct parents.
   */
  async seedDefaults(storeCode: string, createdById: string): Promise<ListResponseDto<LedgerAccountDto>> {
    const created = await this.unitOfWork.transaction(async (transactionClient) => {
      const existing = await transactionClient.ledgerAccount.findMany({ where: { storeCode }, select: { code: true, systemKey: true } });
      const existingByCode = new Map(existing.map((account) => [account.code, account] as const));
      const claimedKeys = new Set(existing.map((account) => account.systemKey).filter((key): key is string => key != null));

      // An account already sitting on a default's code takes on that default's system key.
      // Without this, a store that hand-made "1110" before setting up the chart would end up
      // with no CASH_IN_HAND at all, and every cash sale would then be refused a posting.
      for (const seed of DEFAULT_CHART_OF_ACCOUNTS) {
        if (!seed.systemKey || claimedKeys.has(seed.systemKey)) continue;
        const occupant = existingByCode.get(seed.code);
        if (!occupant || occupant.systemKey != null) continue;

        await transactionClient.ledgerAccount.update({
          where: { storeCode_code: { storeCode, code: seed.code } },
          data: { systemKey: seed.systemKey, isSystem: true, isActive: true, updatedById: createdById, updatedAt: new Date() },
        });
        claimedKeys.add(seed.systemKey);
      }

      const pending = DEFAULT_CHART_OF_ACCOUNTS.filter((seed) => !existingByCode.has(seed.code));
      if (pending.length === 0) return [];

      await transactionClient.ledgerAccount.createMany({
        data: pending.map((seed) => ({
          storeCode,
          code: seed.code,
          name: seed.name,
          category: seed.category,
          subType: seed.subType,
          description: seed.description ?? null,
          isSystem: true,
          systemKey: seed.systemKey ?? null,
          displayOrder: Number(seed.code),
          createdById,
        })),
      });

      const all = await transactionClient.ledgerAccount.findMany({ where: { storeCode }, select: { id: true, code: true } });
      const idByCode = new Map(all.map((account) => [account.code, account.id] as const));

      const childCodesByParent = new Map<string, string[]>();
      for (const seed of pending) {
        if (!seed.parentCode) continue;
        const siblings = childCodesByParent.get(seed.parentCode) ?? [];
        siblings.push(seed.code);
        childCodesByParent.set(seed.parentCode, siblings);
      }

      for (const [parentCode, childCodes] of childCodesByParent) {
        const parentId = idByCode.get(parentCode);
        if (parentId == null) continue;
        await transactionClient.ledgerAccount.updateMany({ where: { storeCode, code: { in: childCodes } }, data: { parentId } });
      }

      const rows = await transactionClient.ledgerAccount.findMany({
        where: { storeCode, code: { in: pending.map((seed) => seed.code) } },
        orderBy: [{ code: 'asc' }],
        select: ledgerAccountSelect,
      });
      return rows.map(toLedgerAccountDto);
    });

    return { totalRecord: created.length, data: created };
  }

  async getStatement(id: number, storeCode: string, filters?: LedgerStatementFilterParams): Promise<LedgerStatementDto> {
    const statement = await this.unitOfWork.LedgerAccount.statement(id, storeCode, filters);
    if (!statement) throw new NotFoundError('Ledger account not found');
    return statement;
  }

  async getTrialBalance(storeCode: string, filters?: LedgerStatementFilterParams): Promise<TrialBalanceDto> {
    return this.unitOfWork.LedgerAccount.trialBalance(storeCode, filters);
  }

  private async findInStore(id: number, storeCode: string): Promise<LedgerAccountDto> {
    const account = await this.unitOfWork.LedgerAccount.findById(id, storeCode);
    if (!account) throw new NotFoundError('Ledger account not found');
    return account;
  }

  /**
   * A parent must live in the same store and share the child's category, because a trial
   * balance rolls children into their parent and a mixed branch would total two different
   * things. An account may not be reparented under itself or its own descendant.
   */
  private async resolveParent(data: LedgerAccountModel, storeCode: string, selfId?: number): Promise<number | null> {
    if (data.parentId == null) return null;
    if (selfId != null && data.parentId === selfId) throw new ClientError('An account cannot be its own parent');

    const parent = await this.unitOfWork.LedgerAccount.findById(data.parentId, storeCode);
    if (!parent) throw new NotFoundError('Parent account not found');

    // Giving an account a child turns it into a heading, and a heading takes no postings - so
    // parenting anything under an account a posting rule resolves would stop every sale that
    // needs it. This is the same failure the systemKey guards exist to prevent, from the
    // other direction.
    if (parent.systemKey) {
      throw new ClientError(`"${parent.name}" is used for automatic posting, so other accounts cannot sit under it`);
    }
    if (parent.category !== data.category) {
      throw new ClientError(`This account must sit under a parent in ${ACCOUNT_CATEGORY_LABELS[data.category]}`);
    }

    if (selfId != null) {
      let cursor: number | null = parent.parentId;
      while (cursor != null) {
        if (cursor === selfId) throw new ClientError('An account cannot be moved under one of its own children');
        const ancestor: LedgerAccountDto | null = await this.unitOfWork.LedgerAccount.findById(cursor, storeCode);
        cursor = ancestor?.parentId ?? null;
      }
    }

    return parent.id;
  }
}
