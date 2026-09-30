import { BrandNameDto, BrandNameFilterParams, CreateBrandNameModel } from '@pms/types';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { ListResponseDto } from '../dtos/list-response.dto';
import ConflictError from '../exceptions/conflict-error';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { brandNameSelect } from '../repository/brand-name.repository';
import { IBrandNameService } from './interfaces/Ibrand-name.service';

@injectable()
export class BrandNameService implements IBrandNameService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: CreateBrandNameModel, storeCode: string): Promise<BrandNameDto> {
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
    return this.unitOfWork.BrandName.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, filters?.sortOrder);
  }

  async getById(id: number, storeCode: string): Promise<BrandNameDto> {
    return this.findInStore(id, storeCode);
  }

  async update(id: number, data: CreateBrandNameModel, storeCode: string): Promise<BrandNameDto> {
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

    // Trashing a brand that products still reference would leave them pointing at a row the
    // admin can no longer see. Category already refuses this; brand now matches.
    const productCount = await this.unitOfWork.BrandName.countProducts(id, storeCode);
    if (productCount > 0) {
      throw new ConflictError(`Cannot delete this brand - ${productCount} product${productCount === 1 ? '' : 's'} still use it.`);
    }

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
