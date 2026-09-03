import { Prisma, Status } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { ProductVariantListItemDto, ProductVariantModel, ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../dtos/list-response.dto';
import { toVariantResponse, VariantRatingDto } from '../dtos/product-variant.dto';
import NotFoundError from '../exceptions/not-found-error';
import ForbiddenError from '../exceptions/forbidden-error';
import { ProductVariantFilterParams } from '../params/product-variant.params';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { resolveVariantSku, resolveVariantSlug } from '../utils/variant-sku';
import { IProductVariantService } from './interfaces/Iproduct-variant.service';

@injectable()
export class ProductVariantService implements IProductVariantService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async create(data: ProductVariantModel, userId: string, storeCode: string): Promise<ProductVariantResponseDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {

      const sku = await resolveVariantSku(transactionClient, {
        storeCode,
        productId: data.productId,
        sku: data.sku,
        attributes: data.attributes,
      });

      const slug = await resolveVariantSlug(transactionClient, { storeCode, name: data.name, slug: data.slug });

      const variant = await transactionClient.productVariant.create({
        data: {
          productId: data.productId,
          storeCode,
          createdById: userId,
          sku,
          slug,
          name: data.name,
          description: data.description,
          attributes: (data.attributes ?? []) as any,
          images: data.images ?? [],
          isActive: data.isActive ?? true,
          status: data.status as Status,
          metadata: { ...data } as any,
          ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
          ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
          ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
          ...(data.barcode !== undefined && { barcode: data.barcode }),
          ...(data.lowStockThreshold != null && { lowStockThreshold: data.lowStockThreshold }),
          ...(data.isOffer !== undefined && { isOffer: data.isOffer }),
        },
        select: { id: true },
      });

      if (data.sellingPrice != null) {
        await this.unitOfWork.PriceHistory.create(
          {
            variantId: variant.id,
            storeCode,
            costPrice: data.costPrice ?? null,
            sellingPrice: data.sellingPrice,
            offerPrice: data.offerPrice ?? null,
            compareAtPrice: data.compareAtPrice ?? null,
            effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
            ...(data.effectiveTo !== undefined && { effectiveTo: data.effectiveTo == null ? null : new Date(data.effectiveTo) }),
            reason: data.reason ?? null,
            createdById: userId,
          },
          transactionClient
        );
      }

      if (data.stockQuantity != null && data.stockQuantity !== 0) {
        await transactionClient.stockHistory.create({
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

      const created = await this.unitOfWork.ProductVariant.findById(variant.id, transactionClient);
      if (!created) throw new NotFoundError('Variant not found');
      return toVariantResponse(created);
    });
  }

  async getAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>> {
    return this.unitOfWork.ProductVariant.findAll(filters);
  }

  async rate(id: number, rating: number, userId: string, storeCode: string): Promise<VariantRatingDto> {
    return this.unitOfWork.transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id, storeCode, deletedAt: null },
        select: { id: true, storeCode: true },
      });
      if (!variant) throw new NotFoundError('Variant not found');

      return this.unitOfWork.ProductVariant.rate(id, rating, userId, variant.storeCode, tx);
    });
  }

  async getById(id: number, storeCode: string): Promise<ProductVariantListItemDto> {
    const variant = await this.unitOfWork.ProductVariant.findDetailById(id, storeCode);
    if (!variant) throw new NotFoundError('Variant not found');
    return variant;
  }

  async update(data: ProductVariantModel, id: number, storeCode: string,): Promise<ProductVariantResponseDto> {
    const existing = await this.unitOfWork.ProductVariant.findById(id);
    if (!existing) throw new NotFoundError('Variant not found');
    if (existing.storeCode !== storeCode) throw new ForbiddenError('Variant does not belong to your store');

    // A date reaches the service as a JSON string, so it is rebuilt before getTime() below.
    const effectiveFrom = data.effectiveFrom != null ? new Date(data.effectiveFrom) : undefined;
    const effectiveTo = data.effectiveTo !== undefined ? (data.effectiveTo == null ? null : new Date(data.effectiveTo)) : undefined;

    return this.unitOfWork.transaction(async (transactionClient) => {
      await transactionClient.productVariant.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.sku !== undefined && { sku: data.sku }),
          ...(data.barcode !== undefined && { barcode: data.barcode }),
          ...(data.attributes !== undefined && { attributes: data.attributes as any }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
          ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
          ...(data.status !== undefined && { status: data.status as Status }),
          ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
          ...(data.lowStockThreshold != null && { lowStockThreshold: data.lowStockThreshold }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.isOffer !== undefined && { isOffer: data.isOffer }),
          ...(data.updatedById !== undefined && { updatedById: data.updatedById }),
        },
      });

      const priceChanged =
        data.sellingPrice != null &&
        (data.sellingPrice !== existing.sellingPrice ||
          (data.costPrice ?? null) !== (existing.costPrice ?? null) ||
          (data.offerPrice !== undefined && (data.offerPrice ?? null) !== (existing.offerPrice ?? null)) ||
          (effectiveTo !== undefined && effectiveTo?.getTime() !== existing.effectiveTo?.getTime()) ||
          effectiveFrom !== undefined);
      if (priceChanged) {
        await this.unitOfWork.PriceHistory.create(
          {
            variantId: id,
            storeCode,
            sellingPrice: data.sellingPrice as number,
            offerPrice: data.offerPrice !== undefined ? data.offerPrice : existing.offerPrice,
            costPrice: data.costPrice ?? null,
            ...(effectiveFrom !== undefined && { effectiveFrom }),
            ...(effectiveTo !== undefined && { effectiveTo }),
            reason: data.reason ?? 'Price updated',
            createdById: data.updatedById as string,
          },
          transactionClient
        );
      }

      if (data.stockQuantity != null && data.stockQuantity !== existing.stockQuantity) {
        await transactionClient.stockHistory.create({
          data: {
            productId: existing.productId,
            variantId: id,
            storeCode,
            createdById: data.updatedById as string,
            quantity: data.stockQuantity - existing.stockQuantity,
            reason: data.reason ?? 'Manual stock adjustment',
          },
        });
      }

      const updated = await this.unitOfWork.ProductVariant.findById(id, transactionClient);
      if (!updated) throw new NotFoundError('Variant not found');
      return toVariantResponse(updated);
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
