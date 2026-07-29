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

  /**
   * Creates a variant and files its price in the PriceHistory ledger, which is the source
   * of truth for what the variant costs. The variant's own price columns are NOT NULL, so
   * the repository seeds them and `syncVariantPrice` then keeps them in step with the
   * ledger's currently effective row.
   */
  async record(data: CreateProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto> {
    // Already inside someone else's transaction (a product save, say) - join it rather
    // than opening a nested one.
    if (tx) return this.createWithPrice(data, tx);

    return this.unitOfWork.transaction((transactionClient) => this.createWithPrice(data, transactionClient));
  }

  private async createWithPrice(data: CreateProductVariantModel, tx: Prisma.TransactionClient): Promise<ProductVariantResponseDto> {
    const variant = await this.unitOfWork.ProductVariant.create(data, tx);

    await this.unitOfWork.PriceHistory.create(
      {
        variantId: variant.id,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice ?? null,
        ...(data.effectiveFrom && { effectiveFrom: data.effectiveFrom }),
        reason: data.reason ?? null,
      },
      tx
    );

    // A future-dated price is staged, so this leaves the seeded figures alone until the
    // date arrives - which is also how product listings read the variant.
    await this.unitOfWork.PriceHistory.syncVariantPrice(variant.id, tx);

    return variant;
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
