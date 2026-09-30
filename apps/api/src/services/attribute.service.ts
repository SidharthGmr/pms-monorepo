import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { AttributeDto, AttributeFilterParams, AttributeModel, ListResponseDto, StatusEnum } from '@pms/types';
import ConflictError from '../exceptions/conflict-error';
import NotFoundError from '../exceptions/not-found-error';
import { attributeSelect } from '../repository/attribute.repository';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IAttributeService } from './interfaces/Iattribute.service';

@injectable()
export class AttributeService implements IAttributeService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: AttributeModel, storeCode: string): Promise<AttributeDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.attribute.create({
        data: {
          storeCode: storeCode,
          name: data.name,
          unit: data.unit || null,
          status: data.status || StatusEnum.Draft,
          displayOrder: data.displayOrder ?? null,
        },
        // Withholds storeCode, same as every read.
        select: attributeSelect,
      });
    });
  }

  async getAll(filters?: AttributeFilterParams): Promise<ListResponseDto<AttributeDto>> {
    // `sortDirection` arrives as free text, so normalise it rather than trusting it.
    const sortOrder = filters?.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return this.unitOfWork.Attribute.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, sortOrder);
  }

  async getById(id: number, storeCode: string): Promise<AttributeDto> {
    return this.findInStore(id, storeCode);
  }

  async update(id: number, data: Partial<AttributeModel>, storeCode: string): Promise<AttributeDto> {
    await this.findInStore(id, storeCode);
    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.attribute.update({
        where: { storeCode_id: { storeCode, id } },
        data: {
          // Only the properties present in the body are written, which is the contract the
          // route documents. Assigning unconditionally reset every column the caller omitted -
          // a unit-only PUT was clearing displayOrder and knocking status back to Draft.
          ...(data.name !== undefined && { name: data.name }),
          ...(data.unit !== undefined && { unit: data.unit || null }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder ?? null }),
        },
        select: attributeSelect,
      });
    });
  }

  async delete(id: number, storeCode: string): Promise<AttributeDto> {
    await this.findInStore(id, storeCode);

    // Trashing an attribute that products still reference would leave them pointing at a
    // row the admin can no longer see. Category already refuses this; attribute now matches.
    const productCount = await this.unitOfWork.Attribute.countProducts(id, storeCode);
    if (productCount > 0) {
      throw new ConflictError(`Cannot delete this attribute - ${productCount} product${productCount === 1 ? '' : 's'} still use it.`);
    }

    return this.unitOfWork.Attribute.delete(id, storeCode);
  }

  // Store-scoped, so a row in another tenant is reported as NotFoundError and the
  // response cannot be used to probe which ids exist elsewhere.
  private async findInStore(id: number, storeCode: string): Promise<AttributeDto> {
    const existing = await this.unitOfWork.Attribute.findById(id, storeCode);
    if (!existing) throw new NotFoundError('Attribute not found');
    return existing;
  }
}
