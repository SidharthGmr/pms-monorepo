import { Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { PriceHistoryDto, PriceHistorySummaryDto } from '../dtos/price-history.dto';
import ForbiddenError from '../exceptions/forbidden-error';
import NotFoundError from '../exceptions/not-found-error';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '../models/price-history.model';
import { PriceHistoryFilterParams } from '../params/price-history.params';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IPriceHistoryService } from './interfaces/Iprice-history.service';

@injectable()
export class PriceHistoryService implements IPriceHistoryService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  /**
   * A price row is only reachable through its variant, so both existence and
   * tenancy are settled here before anything reads or writes the ledger.
   */
  private async assertVariantInStore(variantId: number, storeCode: string, tx?: Prisma.TransactionClient): Promise<void> {
    const scope = await this.unitOfWork.PriceHistory.getVariantScope(variantId, tx);
    if (!scope) throw new NotFoundError('Product variant not found');
    if (scope.storeCode !== storeCode) throw new ForbiddenError('Product variant does not belong to your store');
  }

  private async findInStore(id: number, storeCode: string, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto> {
    const row = await this.unitOfWork.PriceHistory.findById(id, tx);
    if (!row) throw new NotFoundError('Price history not found');
    if (row.variant?.storeCode !== storeCode) throw new ForbiddenError('Price history does not belong to your store');
    return row;
  }

  async getAll(filters?: PriceHistoryFilterParams): Promise<ListResponseDto<PriceHistoryDto>> {
    return this.unitOfWork.PriceHistory.findAll(filters);
  }

  async getById(id: number, storeCode: string): Promise<PriceHistoryDto | null> {
    return this.findInStore(id, storeCode);
  }

  async getByVariant(variantId: number, storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<PriceHistoryDto>> {
    await this.assertVariantInStore(variantId, storeCode);
    return this.unitOfWork.PriceHistory.findByVariant(variantId, page, limit);
  }

  async getEffectiveOn(variantId: number, date: Date, storeCode: string, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto | null> {
    await this.assertVariantInStore(variantId, storeCode, tx);
    return this.unitOfWork.PriceHistory.getEffectiveOn(variantId, date, tx);
  }

  async getSummary(variantId: number, storeCode: string): Promise<PriceHistorySummaryDto> {
    await this.assertVariantInStore(variantId, storeCode);
    return this.unitOfWork.PriceHistory.getSummary(variantId);
  }

  async create(data: CreatePriceHistoryModel, storeCode: string, tx?: Prisma.TransactionClient): Promise<PriceHistoryDto> {
    // Already inside someone else's transaction (a product/variant save, say) -
    // join it instead of opening a nested one.
    if (tx) return this.append(data, storeCode, tx);

    return this.unitOfWork.transaction((transactionClient) => this.append(data, storeCode, transactionClient));
  }

  private async append(data: CreatePriceHistoryModel, storeCode: string, tx: Prisma.TransactionClient): Promise<PriceHistoryDto> {
    await this.assertVariantInStore(data.variantId, storeCode, tx);

    // The ledger is the only place a price lives now, so there is no cache to refresh
    // afterwards - the insert (and the `effectiveTo` it closes) is the whole write.
    return this.unitOfWork.PriceHistory.create(data, tx);
  }

  async update(id: number, data: UpdatePriceHistoryModel, storeCode: string): Promise<PriceHistoryDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      await this.findInStore(id, storeCode, transactionClient);
      return this.unitOfWork.PriceHistory.update(id, data, transactionClient);
    });
  }

  async delete(id: number, storeCode: string): Promise<PriceHistoryDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      await this.findInStore(id, storeCode, transactionClient);
      return this.unitOfWork.PriceHistory.delete(id, transactionClient);
    });
  }
}
