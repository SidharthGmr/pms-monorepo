import { Prisma } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto, ProductDetailResponseDto, ProductModel, ProductResponseDto, StatusEnum } from "@pms/types";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { CreateProductVariantModel } from "../models/product-variant.model";
import { ProductFilterParams } from "../params/product.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { AddStockModel, IProductService } from "./interfaces/Iproduct.service";
import { Json } from "twilio/lib/interfaces";




@injectable()
export class ProductService implements IProductService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }



  async getAll(filters?: ProductFilterParams) {
    return this.unitOfWork.Product.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy, filters?.sortOrder);
  }

  async getById(id: number): Promise<ProductDetailResponseDto | null> {
    const product = await this.unitOfWork.Product.findById(id);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  async delete(id: number, userId: string,): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.Product.delete(id, userId);
  }

  async create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const productData = await transactionClient.product.create({
        data: {
          storeCode: storeCode,
          createdById: userId,
          name: data.name,
          brandNameId: data.brandNameId || null,
          attributeId: data.attributeId || null,
          parentId: data.parentId || null,
          categoryId: data.categoryId,
          slug: data.slug,
          description: data.description || null,
          status: data.status || StatusEnum.Published,
          metadata: { ...data } as any,
          ...(data.images !== undefined && { images: data.images }),
          ...(data.displayOrder != null && { displayOrder: data.displayOrder }),
        },
      });
      return productData;
    });
  }

  async update(id: number, data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.transaction(async (transactionClient) => {
      const updateData: any = {
        name: data.name,
        brandNameId: data.brandNameId || null,
        attributeId: data.attributeId || null,
        slug: data.slug,
        description: data.description || null,
        categoryId: data.categoryId,
        status: data.status,
        updatedById: userId,
        updatedAt: new Date(),
      };

      if (data.images !== undefined) {
        updateData.images = data.images;
      }

      const storeData = await transactionClient.product.update({
        where: { id: id },
        data: updateData,
      });

      // The product form edits the default variant - the first active one. A price change
      // appends to that variant's ledger; it no longer spawns a whole new variant, which is
      // what the old price-versioned design did and would now create phantom sizes.
      const [defaultVariant] = await this.unitOfWork.ProductVariant.getActive(id, transactionClient);

      if (data.sellingPrice != null) {
        const newCost = data.costPrice ?? null;

        if (!defaultVariant) {
          await this.recordPricedVariant(
            {
              productId: id,
              storeCode,
              sellingPrice: data.sellingPrice,
              costPrice: newCost,
              ...(data.lowStockThreshold != null && { lowStockThreshold: data.lowStockThreshold }),
              reason: 'Initial price',
              createdById: userId,
            },
            transactionClient
          );
        } else {
          // Only when the figure actually moved, so an unrelated save does not pile up
          // identical ledger rows.
          const priceChanged = Number(defaultVariant.sellingPrice ?? NaN) !== Number(data.sellingPrice);
          const costChanged = Number(defaultVariant.costPrice ?? NaN) !== Number(newCost ?? NaN);

          if (priceChanged || costChanged) {
            await this.unitOfWork.PriceHistory.create(
              {
                variantId: defaultVariant.id,
                storeCode,
                sellingPrice: data.sellingPrice,
                costPrice: newCost,
                reason: 'Price updated',
                createdById: userId,
              },
              transactionClient
            );
          }
        }
      }

      if (data.lowStockThreshold != null && defaultVariant) {
        await transactionClient.productVariant.update({
          where: { id: defaultVariant.id },
          data: { lowStockThreshold: data.lowStockThreshold, updatedById: userId },
        });
      }

      // Stock is the sum of stockHistory movements, so an absolute stock value from the form
      // is recorded as the delta needed to reach it - booked against the default variant when
      // there is one, so variant stock and product stock agree.
      if (data.stock != null) {
        const currentStock = defaultVariant
          ? await this.unitOfWork.ProductVariant.getVariantStock(defaultVariant.id, transactionClient)
          : await this.unitOfWork.Product.getCurrentStock(id, transactionClient);
        const delta = data.stock - currentStock;
        if (delta !== 0) {
          await this.unitOfWork.Product.createStockHistory(
            {
              productId: id,
              ...(defaultVariant && { variantId: defaultVariant.id }),
              storeCode,
              userId,
              quantity: delta,
              reason: 'Stock adjusted on product update',
            },
            transactionClient
          );
        }
      }

      return storeData;
    });
  }




  private async recordPricedVariant(model: CreateProductVariantModel, tx: Prisma.TransactionClient) {
    const variant = await this.unitOfWork.ProductVariant.create(model, tx);

    await this.unitOfWork.PriceHistory.create(
      {
        variantId: variant.id,
        storeCode: model.storeCode,
        sellingPrice: model.sellingPrice,
        costPrice: model.costPrice ?? null,
        compareAtPrice: model.compareAtPrice ?? null,
        ...(model.effectiveFrom && { effectiveFrom: model.effectiveFrom }),
        reason: model.reason ?? null,
        createdById: model.createdById,
      },
      tx
    );

    if (model.stockQuantity) {
      await this.unitOfWork.Product.createStockHistory(
        {
          productId: model.productId,
          variantId: variant.id,
          storeCode: model.storeCode,
          userId: model.createdById,
          quantity: model.stockQuantity,
          reason: 'Opening stock',
        },
        tx
      );
    }

    return variant;
  }





  async getLowStock(filters?: ProductFilterParams) {
    return this.unitOfWork.Product.findLowStock(filters, filters?.page, filters?.recordPerPage);
  }




  /**
   * Books stock against one variant. Stock is held per variant - Small and Large keep their
   * own counts - so the movement records which variant it belongs to. There is no cache to
   * recompute: the movements themselves are the stock.
   */
  async addStock(id: number, data: AddStockModel, userId: string, storeCode: string): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");

    return this.unitOfWork.transaction(async (transactionClient) => {
      // The variant has to be one of this product's, in this store - otherwise stock
      // could be booked against someone else's variant by passing its id.
      const scope = await this.unitOfWork.PriceHistory.getVariantScope(data.variantId, transactionClient);
      if (!scope) throw new NotFoundError("Product variant not found");
      if (scope.productId !== id) throw new ForbiddenError("That variant belongs to a different product");
      if (scope.storeCode !== storeCode) throw new ForbiddenError("That variant belongs to a different store");

      await this.unitOfWork.Product.createStockHistory(
        {
          productId: id,
          variantId: data.variantId,
          storeCode,
          userId,
          quantity: data.quantity,
          reason: data.reason ?? null,
        },
        transactionClient
      );

      // An optional price change goes to this variant's ledger rather than spawning
      // another variant row, which is what the old product-level flow did.
      if (data.sellingPrice !== undefined) {
        await this.unitOfWork.PriceHistory.create(
          {
            variantId: data.variantId,
            storeCode,
            sellingPrice: data.sellingPrice,
            costPrice: data.costPrice ?? null,
            reason: data.reason ?? null,
            createdById: userId,
          },
          transactionClient
        );
      }

      return existing;
    });
  }

  async getStockHistory(id: number, page?: number, limit?: number, variantId?: number): Promise<ListResponseDto<any>> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.Product.getStockHistory(id, page, limit, variantId);
  }

}
