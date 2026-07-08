import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { AttributeDto } from '../dtos/attribute.dto';
import { ListResponseDto } from '../dtos/list-response.dto';
import { Status } from '../enum/status.enum';
import NotFoundError from '../exceptions/not-found-error';
import { AttributeModel } from '../models/attribute.model';
import { AttributeFilterParams } from '../params/attribute.params';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IAttributeService } from './interfaces/Iattribute.service';

@injectable()
export class AttributeService implements IAttributeService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getAll(filters?: AttributeFilterParams): Promise<ListResponseDto<AttributeDto>> {
    return this.unitOfWork.Attribute.findAll(filters, filters?.page, filters?.recordPerPage);
  }

  async getById(id: number): Promise<AttributeDto | null> {
    const attr = await this.unitOfWork.Attribute.findById(id);
    if (!attr) throw new NotFoundError('Attribute not found');
    return attr;
  }

  async create(data: AttributeModel, storeCode: string): Promise<AttributeDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const category = await transactionClient.attribute.create({
        data: {
          storeCode: storeCode,
          name: data.name,
          unit: data.unit || null,
          status: data.status || Status.Draft,
          displayOrder: data.displayOrder || null,
        },
      });
      return category;
    });
  }

  async update(id: number, data: AttributeModel): Promise<AttributeDto> {
    const existing = await this.unitOfWork.Attribute.findById(id);
    if (!existing) throw new NotFoundError('Attribute not found');
    return this.unitOfWork.transaction(async (transactionClient) => {
      const category = await transactionClient.attribute.update({
        where: { id },
        data: {
          name: data.name,
          unit: data.unit || null,
          status: data.status || Status.Draft,
          displayOrder: data.displayOrder || null,
          updatedAt: new Date(),
        },
      });
      return category;
    });
  }

  async delete(id: number): Promise<AttributeDto> {
    const existing = await this.unitOfWork.Attribute.findById(id);
    if (!existing) throw new NotFoundError('Attribute not found');
    return this.unitOfWork.Attribute.delete(id);
  }
}
