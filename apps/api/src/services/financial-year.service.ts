import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { FinancialYearDto, FinancialYearModel, ListResponseDto, PageFilterParams } from '@pms/types';
import ClientError from '../exceptions/client-error';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { financialYearSelect, toFinancialYearDto } from '../repository/financial-year.repository';
import { IFinancialYearService } from './interfaces/Ifinancial-year.service';

@injectable()
export class FinancialYearService implements IFinancialYearService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async create(data: FinancialYearModel, storeCode: string): Promise<FinancialYearDto> {
    const { startDate, endDate } = this.parseRange(data);
    await this.assertNoOverlap(storeCode, startDate, endDate);

    const financialYearData = await this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.financialYear.create({
        data: { storeCode, name: data.name.trim(), startDate, endDate },
        select: financialYearSelect,
      });
    });

    return toFinancialYearDto(financialYearData);
  }

  async getAll(filters?: PageFilterParams): Promise<ListResponseDto<FinancialYearDto>> {
    const sortOrder = filters?.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return this.unitOfWork.FinancialYear.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, sortOrder);
  }

  async getById(id: number, storeCode: string): Promise<FinancialYearDto | null> {
    return this.findInStore(id, storeCode);
  }

  async update(id: number, data: FinancialYearModel, storeCode: string): Promise<FinancialYearDto> {
    const existing = await this.findInStore(id, storeCode);
    if (existing.isClosed) throw new ClientError('Reopen this financial year before changing its dates');

    const { startDate, endDate } = this.parseRange(data);
    await this.assertNoOverlap(storeCode, startDate, endDate, id);

    // Narrowing a year would strand vouchers outside every year, where nothing can reconcile
    // them, so the new range has to still contain everything already posted into it.
    const stranded = await this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.journalEntry.count({
        where: { storeCode, financialYearId: id, OR: [{ entryDate: { lt: startDate } }, { entryDate: { gt: endDate } }] },
      });
    });
    if (stranded > 0) {
      throw new ClientError(`${stranded} posted ${stranded === 1 ? 'voucher falls' : 'vouchers fall'} outside the new dates`);
    }

    const financialYearData = await this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.financialYear.update({
        where: { id, storeCode },
        data: { name: data.name.trim(), startDate, endDate, updatedAt: new Date() },
        select: financialYearSelect,
      });
    });

    return toFinancialYearDto(financialYearData);
  }

  async delete(id: number, storeCode: string): Promise<FinancialYearDto> {
    const existing = await this.findInStore(id, storeCode);
    if ((existing.entryCount ?? 0) > 0) throw new ClientError('This financial year already has posted vouchers, so it cannot be deleted');
    return this.unitOfWork.FinancialYear.delete(id, storeCode);
  }

  async setClosed(id: number, isClosed: boolean, storeCode: string, userId: string): Promise<FinancialYearDto> {
    const existing = await this.findInStore(id, storeCode);
    if (existing.isClosed === isClosed) {
      throw new ClientError(isClosed ? 'This financial year is already closed' : 'This financial year is already open');
    }

    const financialYearData = await this.unitOfWork.transaction(async (transactionClient) => {
      const updated = await transactionClient.financialYear.update({
        where: { id, storeCode },
        data: {
          isClosed,
          closedAt: isClosed ? new Date() : null,
          closedById: isClosed ? userId : null,
          updatedAt: new Date(),
        },
        select: financialYearSelect,
      });

      await transactionClient.accountingAuditLog.create({
        data: {
          storeCode,
          action: isClosed ? 'FINANCIAL_YEAR_CLOSED' : 'FINANCIAL_YEAR_REOPENED',
          entityType: 'financialYear',
          entityId: id,
          summary: `${existing.name} ${isClosed ? 'closed' : 'reopened'}`,
          performedById: userId,
        },
      });

      return updated;
    });

    return toFinancialYearDto(financialYearData);
  }

  private async findInStore(id: number, storeCode: string): Promise<FinancialYearDto> {
    const year = await this.unitOfWork.FinancialYear.findById(id, storeCode);
    if (!year) throw new NotFoundError('Financial year not found');
    return year;
  }

  private parseRange(data: FinancialYearModel): { startDate: Date; endDate: Date } {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime())) throw new ClientError('Enter a valid start date');
    if (Number.isNaN(endDate.getTime())) throw new ClientError('Enter a valid end date');
    if (endDate <= startDate) throw new ClientError('The end date must be after the start date');
    return { startDate, endDate };
  }

  private async assertNoOverlap(storeCode: string, startDate: Date, endDate: Date, excludeId?: number): Promise<void> {
    const clash = await this.unitOfWork.FinancialYear.findOverlapping(storeCode, startDate, endDate, excludeId);
    if (clash) throw new ClientError(`These dates overlap the financial year ${clash.name}`);
  }
}
