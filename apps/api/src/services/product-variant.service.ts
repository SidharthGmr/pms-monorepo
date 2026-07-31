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
   * Creates a variant and files its price in the PriceHistory ledger, which is the only
   * place a price is stored. Any opening stock becomes the variant's first stockHistory
   * movement, so the ledger and the movements together are the whole truth about it.
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
        storeCode: data.storeCode,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice ?? null,
        compareAtPrice: data.compareAtPrice ?? null,
        ...(data.effectiveFrom && { effectiveFrom: data.effectiveFrom }),
        reason: data.reason ?? null,
        createdById: data.createdById,
      },
      tx
    );

    // Opening stock has to be booked as a movement - there is no stock column to seed, and
    // a variant whose movements do not add up to its stock would be unreconcilable.
    if (data.stockQuantity) {
      await this.unitOfWork.Product.createStockHistory(
        {
          productId: data.productId,
          variantId: variant.id,
          storeCode: data.storeCode,
          userId: data.createdById,
          quantity: data.stockQuantity,
          reason: 'Opening stock',
        },
        tx
      );
    }

    // Re-read so the caller gets the price and stock just written rather than the empty
    // shell `create` returns.
    return (await this.unitOfWork.ProductVariant.findById(variant.id, tx)) ?? variant;
  }

  async getEffectiveOn(variantId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null> {
    return this.unitOfWork.ProductVariant.getEffectiveOn(variantId, date, tx);
  }

  async getHistory(productId: number, storeCode: string, page = 1, limit = 10): Promise<ListResponseDto<ProductVariantResponseDto>> {
    const product = await this.unitOfWork.Product.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.storeCode !== storeCode) throw new ForbiddenError('Product does not belong to your store');
    return this.unitOfWork.ProductVariant.getHistory(productId, storeCode, page, limit);
  }
}
