import { Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import NotFoundError from '../exceptions/not-found-error';
import ForbiddenError from '../exceptions/forbidden-error';
import { CreateProductVariantModel } from '../models/product-variant.model';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IProductVariantService } from './interfaces/Iproduct-variant.service';

@injectable()
export class ProductVariantService implements IProductVariantService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async record(data: CreateProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto> {
    return this.unitOfWork.ProductVariant.create(data, tx);
  }

  async getEffectiveOn(productId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null> {
    return this.unitOfWork.ProductVariant.getEffectiveOn(productId, date, tx);
  }

  async getHistory(productId: number, storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<ProductVariantResponseDto>> {
    const product = await this.unitOfWork.Product.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.storeCode !== storeCode) throw new ForbiddenError('Product does not belong to your store');
    return this.unitOfWork.ProductVariant.getHistory(productId, storeCode, page, limit);
  }
}
