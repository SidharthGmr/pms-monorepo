import { Prisma, Status } from '@prisma/client';
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
    return this.unitOfWork.transaction(async (tx) => {

      const variant = await this.unitOfWork.ProductVariant.create(
        {
          productId: data.productId,
          storeCode,
          createdById: userId,
          sellingPrice: data.sellingPrice,
          status: (data.status ?? StatusEnum.Draft) as Status,
          ...(data.attributes != null && { attributes: data.attributes }),
          ...(data.sku && { sku: data.sku }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
          ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
          ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
          ...(data.barcode !== undefined && { barcode: data.barcode }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
        },
        tx
      );

      // 2. Price goes to the ledger. Null means "not priced yet", so no row is filed.
      if (data.sellingPrice != null) {
        await this.unitOfWork.PriceHistory.create(
          {
            variantId: variant.id,
            storeCode,
            sellingPrice: data.sellingPrice,
            costPrice: data.costPrice ?? null,
            compareAtPrice: data.compareAtPrice ?? null,
            ...(data.effectiveFrom && { effectiveFrom: data.effectiveFrom }),
            reason: data.reason ?? null,
            createdById: userId,
          },
          tx
        );
      }

      // 3. Opening stock is booked as a movement so on-hand stays the sum of its history.
      if (data.stockQuantity != null && data.stockQuantity !== 0) {
        await tx.stockHistory.create({
          data: {
            productId: data.productId,
            variantId: variant.id,
            storeCode,
            createdById: userId,
            quantity: data.stockQuantity,
            reason: data.reason ?? 'Opening stock',
          },
        });
      }

      // 4. Re-read so the DTO carries the effective price and stock just booked.
      return (await this.unitOfWork.ProductVariant.findById(variant.id, tx)) as ProductVariantResponseDto;
    });
  }


  async update(id: number, storeCode: string, data: UpdateProductVariantModel): Promise<ProductVariantResponseDto> {
    const existing = await this.unitOfWork.ProductVariant.findById(id);
    if (!existing) throw new NotFoundError('Variant not found');
    if (existing.storeCode !== storeCode) throw new ForbiddenError('Variant does not belong to your store');

    return this.unitOfWork.transaction(async (tx) => {

      await this.unitOfWork.ProductVariant.update(id, data, tx);


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
      if (data.stockQuantity != null && data.stockQuantity !== existing.stockQuantity) {
        await tx.stockHistory.create({
          data: {
            productId: existing.productId,
            variantId: id,
            storeCode,
            createdById: data.updatedById,
            quantity: data.stockQuantity - existing.stockQuantity,
            reason: data.reason ?? 'Manual stock adjustment',
          },
        });
      }

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
