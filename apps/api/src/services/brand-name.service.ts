import { CreateBrandModel } from '@pms/types';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { BrandNameDto } from '../dtos/brand-name.dto';
import { ListResponseDto } from '../dtos/list-response.dto';
import NotFoundError from '../exceptions/not-found-error';
import { BrandNameFilterParams } from '../params/brand-name.params';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { brandNameSelect } from '../repository/brand-name.repository';
import { IBrandNameService } from './interfaces/Ibrand-name.service';

@injectable()
export class BrandNameService implements IBrandNameService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: CreateBrandModel, storeCode: string): Promise<BrandNameDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const brandNameData = await transactionClient.brandName.create({
        data: {
          name: data.name,
          storeCode,
          ...(data.status !== undefined && { status: data.status }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        },
        select: brandNameSelect,
      });
      return brandNameData;
    });
  }

  async getAll(filters?: BrandNameFilterParams): Promise<ListResponseDto<BrandNameDto>> {
    return this.unitOfWork.BrandName.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy, filters?.sortOrder);
  }

  async getById(id: number, storeCode: string): Promise<BrandNameDto> {
    return this.findInStore(id, storeCode);
  }

  async update(id: number, data: CreateBrandModel, storeCode: string): Promise<BrandNameDto> {
    await this.findInStore(id, storeCode);

    return this.unitOfWork.transaction(async (transactionClient) => {
      const brandNameData = await transactionClient.brandName.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
          updatedAt: new Date(),
        },
        select: brandNameSelect,
      });
      return brandNameData;
    });
  }

  async delete(id: number, storeCode: string): Promise<BrandNameDto> {
    await this.findInStore(id, storeCode);
    return this.unitOfWork.BrandName.delete(id, storeCode);
  }

  // `findById` is scoped to the store, so a row in another tenant comes back null and is
  // reported as NotFoundError - the response cannot be used to probe which ids exist
  // elsewhere. `storeCode` itself is withheld from the DTO, so it is no longer readable here.
  private async findInStore(id: number, storeCode: string): Promise<BrandNameDto> {
    const existing = await this.unitOfWork.BrandName.findById(id, storeCode);
    if (!existing) throw new NotFoundError('Brand name not found');
    return existing;
  }
}
