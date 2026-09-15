import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { AttributeDto, AttributeFilterParams, AttributeModel, ListResponseDto, StatusEnum } from '@pms/types';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IAttributeService } from './interfaces/Iattribute.service';

@injectable()
export class AttributeService implements IAttributeService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: AttributeModel, storeCode: string): Promise<AttributeDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const attributeData = await transactionClient.attribute.create({
        data: {
          storeCode: storeCode,
          name: data.name,
          unit: data.unit || null,
          status: data.status || StatusEnum.Draft,
          displayOrder: data.displayOrder || null,
        },
      });
      return attributeData;
    });
  }

  async getAll(filters?: AttributeFilterParams): Promise<ListResponseDto<AttributeDto>> {
    return this.unitOfWork.Attribute.findAll(filters, filters?.page, filters?.recordPerPage);
  }

  async getById(id: number): Promise<AttributeDto | null> {
    const attr = await this.unitOfWork.Attribute.findById(id);
    if (!attr) throw new NotFoundError('Attribute not found');
    return attr;
  }

  async update(id: number, data: AttributeModel): Promise<AttributeDto> {
    const existing = await this.unitOfWork.Attribute.findById(id);
    if (!existing) throw new NotFoundError('Attribute not found');
    return this.unitOfWork.transaction(async (transactionClient) => {
      const attributeData = await transactionClient.attribute.update({
        where: { id },
        data: {
          name: data.name,
          unit: data.unit || null,
          status: data.status || StatusEnum.Draft,
          displayOrder: data.displayOrder || null,
          updatedAt: new Date(),
        },
      });
      return attributeData;
    });
  }

  async delete(id: number): Promise<AttributeDto> {
    const existing = await this.unitOfWork.Attribute.findById(id);
    if (!existing) throw new NotFoundError('Attribute not found');
    return this.unitOfWork.Attribute.delete(id);
  }
}
