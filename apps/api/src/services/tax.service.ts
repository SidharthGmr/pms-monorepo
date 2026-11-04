import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { ListResponseDto, TaxDto, TaxFilterParams, TaxModel } from '@pms/types';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { ITaxService } from './interfaces/Itax.service';

@injectable()
export class TaxService implements ITaxService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async create(data: TaxModel): Promise<TaxDto> {
    // Only one tax can be the default, so electing this one steps the others down
    // inside the same transaction. `rate` comes back as a Decimal, so the row is
    // re-read through the repository, which maps it to the number the DTO promises.
    const taxData = await this.unitOfWork.transaction(async (transactionClient) => {
      if (data.isDefault) {
        await transactionClient.tax.updateMany({ where: { isDefault: true, deletedAt: null }, data: { isDefault: false } });
      }
      return transactionClient.tax.create({
        data: {
          name: data.name,
          code: data.code,
          rate: data.rate,
          ...(data.category !== undefined && { category: data.category }),
          isActive: data.isActive ?? true,
          isDefault: data.isDefault ?? false,
        },
        select: { id: true },
      });
    });

    const created = await this.unitOfWork.Tax.findById(taxData.id);
    if (!created) throw new NotFoundError('Tax not found');
    return created;
  }

  async getAll(filters?: TaxFilterParams): Promise<ListResponseDto<TaxDto>> {
    // PageFilterParams calls it sortDirection; the repository takes sortOrder.
    const sortOrder = filters?.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return this.unitOfWork.Tax.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, sortOrder);
  }

  async getById(id: string): Promise<TaxDto | null> {
    const tax = await this.unitOfWork.Tax.findById(id);
    if (!tax) throw new NotFoundError('Tax not found');
    return tax;
  }

  async update(id: string, data: TaxModel): Promise<TaxDto> {
    const existing = await this.unitOfWork.Tax.findById(id);
    if (!existing) throw new NotFoundError('Tax not found');

    await this.unitOfWork.transaction(async (transactionClient) => {
      if (data.isDefault && !existing.isDefault) {
        await transactionClient.tax.updateMany({ where: { isDefault: true, deletedAt: null }, data: { isDefault: false } });
      }
      await transactionClient.tax.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          rate: data.rate,
          ...(data.category !== undefined && { category: data.category }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });
    });

    const updated = await this.unitOfWork.Tax.findById(id);
    if (!updated) throw new NotFoundError('Tax not found');
    return updated;
  }

  async delete(id: string): Promise<TaxDto> {
    const existing = await this.unitOfWork.Tax.findById(id);
    if (!existing) throw new NotFoundError('Tax not found');
    return this.unitOfWork.Tax.delete(id);
  }
}
