import { Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { ProductVariantListItemDto, ProductVariantModel, ProductVariantResponseDto, StatusEnum } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import NotFoundError from '../exceptions/not-found-error';
import ForbiddenError from '../exceptions/forbidden-error';
import { CreateProductVariantModel, UpdateProductVariantModel } from '../models/product-variant.model';
import { ProductVariantFilterParams } from '../params/product-variant.params';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { IProductVariantService } from './interfaces/Iproduct-variant.service';

@injectable()
export class ProductVariantService implements IProductVariantService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>> {
    return this.unitOfWork.ProductVariant.findAll(filters);
  }


  async create(data: ProductVariantModel, userId: string, storeCode: string): Promise<ProductVariantResponseDto> {
    return this.record({
      productId: data.productId,
      storeCode,
      createdById: userId,
      sellingPrice: data.sellingPrice,
      costPrice: data.costPrice ?? null,
      compareAtPrice: data.compareAtPrice ?? null,
      reason: data.reason ?? null,
      status: data.status ?? StatusEnum.Draft,
      ...(data.attributes && Object.keys(data.attributes).length > 0 && { attributes: data.attributes }),
      //...(data.attributes !== undefined && { attributes: data.attributes }),
      ...(data.sku && { sku: data.sku }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.images !== undefined && { images: data.images }),
      ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
      ...(data.stockQuantity != null && { stockQuantity: data.stockQuantity }),
      ...(data.effectiveFrom && { effectiveFrom: data.effectiveFrom }),
    });
  }


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

    // No price given means the variant is genuinely unpriced - filing a ledger row anyway
    // would record a zero, which reads as "costs nothing" rather than "not priced yet".
    if (data.sellingPrice != null) {
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
    }

    // Opening stock has to be booked as a movement - there is no stock column to seed, and
    // a variant whose movements do not add up to its stock would be unreconcilable.
    // if (data.stockQuantity) {
    //   await this.unitOfWork.Product.createStockHistory(
    //     {
    //       productId: data.productId,
    //       variantId: variant.id,
    //       storeCode: data.storeCode,
    //       userId: data.createdById,
    //       quantity: data.stockQuantity,
    //       reason: 'Opening stock',
    //     },
    //     tx
    //   );
    // }

    // Re-read so the caller gets the price and stock just written rather than the empty
    // shell `create` returns.
    return (await this.unitOfWork.ProductVariant.findById(variant.id, tx)) ?? variant;
  }

  async update(id: number, storeCode: string, data: UpdateProductVariantModel): Promise<ProductVariantResponseDto> {
    const existing = await this.unitOfWork.ProductVariant.findById(id);
    if (!existing) throw new NotFoundError('Variant not found');
    if (existing.storeCode !== storeCode) throw new ForbiddenError('Variant does not belong to your store');

    return this.unitOfWork.transaction(async (tx) => {
      // 1. Plain columns (name, sku, barcode, attributes, images, threshold, active).
      await this.unitOfWork.ProductVariant.update(id, data, tx);

      // 2. Reprice: a changed price (or a staged future date) is appended to the ledger,
      //    never overwritten, so past orders keep the price they were sold at.
      const priceChanged =
        data.sellingPrice != null &&
        (data.sellingPrice !== existing.sellingPrice ||
          (data.costPrice ?? null) !== (existing.costPrice ?? null) ||
          data.effectiveFrom !== undefined);
      if (priceChanged) {
        await this.unitOfWork.PriceHistory.create(
          {
            variantId: id,
            storeCode,
            sellingPrice: data.sellingPrice as number,
            costPrice: data.costPrice ?? null,
            ...(data.effectiveFrom && { effectiveFrom: data.effectiveFrom }),
            reason: data.reason ?? 'Price updated',
            createdById: data.updatedById,
          },
          tx
        );
      }

      // 3. Stock: book the delta needed to reach the target on-hand, keeping stock the
      //    auditable sum of its movements rather than a mutable column.
      // if (data.stockQuantity != null && data.stockQuantity !== existing.stockQuantity) {
      //   await this.unitOfWork.Product.createStockHistory(
      //     {
      //       productId: existing.productId,
      //       variantId: id,
      //       storeCode,
      //       userId: data.updatedById,
      //       quantity: data.stockQuantity - existing.stockQuantity,
      //       reason: data.reason ?? 'Manual stock adjustment',
      //     },
      //     tx
      //   );
      // }

      return (await this.unitOfWork.ProductVariant.findById(id, tx)) as ProductVariantResponseDto;
    });
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
