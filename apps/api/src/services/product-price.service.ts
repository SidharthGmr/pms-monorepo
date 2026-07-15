import { Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { ProductPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import NotFoundError from '../exceptions/not-found-error';
import ForbiddenError from '../exceptions/forbidden-error';
import { CreateProductPriceModel } from '../models/product-price.model';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IProductPriceService } from './interfaces/Iproduct-price.service';

@injectable()
export class ProductPriceService implements IProductPriceService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async record(data: CreateProductPriceModel, tx?: Prisma.TransactionClient): Promise<ProductPriceResponseDto> {
    return this.unitOfWork.ProductPrice.create(data, tx);
  }

  async getEffectiveOn(productId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductPriceResponseDto | null> {
    return this.unitOfWork.ProductPrice.getEffectiveOn(productId, date, tx);
  }

  async getHistory(productId: number, storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<ProductPriceResponseDto>> {
    const product = await this.unitOfWork.Product.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.storeCode !== storeCode) throw new ForbiddenError('Product does not belong to your store');
    return this.unitOfWork.ProductPrice.getHistory(productId, storeCode, page, limit);
  }
}
