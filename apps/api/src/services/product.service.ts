import { Prisma } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto, ProductModel, ProductResponseDto, StatusEnum } from "@pms/types";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { CreateProductVariantModel } from "../models/product-variant.model";
import { ProductFilterParams } from "../params/product.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { AddStockModel, IProductService } from "./interfaces/Iproduct.service";




@injectable()
export class ProductService implements IProductService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }

  /**
   * Appends a priced variant row and files that price in the PriceHistory ledger, which
   * is the source of truth for what a variant costs; the variant's own price columns are
   * a cache of the currently effective row.
   *
   * Product saves talk to the repository rather than `ProductVariantService` because they
   * already own a transaction, so the ledger write lives here too - otherwise a price set
   * from the product form would never reach the ledger.
   */
  private async recordPricedVariant(model: CreateProductVariantModel, tx: Prisma.TransactionClient) {
    const variant = await this.unitOfWork.ProductVariant.create(model, tx);

    await this.unitOfWork.PriceHistory.create(
      {
        variantId: variant.id,
        sellingPrice: model.sellingPrice,
        costPrice: model.costPrice ?? null,
        ...(model.effectiveFrom && { effectiveFrom: model.effectiveFrom }),
        reason: model.reason ?? null,
      },
      tx
    );

    await this.unitOfWork.PriceHistory.syncVariantPrice(variant.id, tx);
    return variant;
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
          lowStockThreshold: data.lowStockThreshold || 5,
          status: data.status || StatusEnum.Published,
        },
      });

      // `sellingPrice`/`costPrice`/`stock` are not columns on `product`: the price
      // becomes the product's first (active) ProductVariant and the stock becomes
      // its first stockHistory movement. Without this they were silently discarded.
      if (data.sellingPrice != null) {
        await this.recordPricedVariant(
          {
            productId: productData.id,
            storeCode,
            sellingPrice: data.sellingPrice,
            costPrice: data.costPrice ?? null,
            reason: 'Initial price',
            createdById: userId,
          },
          transactionClient
        );
      }

      if (data.stock != null && data.stock !== 0) {
        await this.unitOfWork.Product.createStockHistory(
          {
            productId: productData.id,
            storeCode,
            userId,
            quantity: data.stock,
            reason: 'Opening stock',
          },
          transactionClient
        );
      }

      return productData;
    });
  }

  async getAll(filters?: ProductFilterParams) {
    return this.unitOfWork.Product.findAll(filters, filters?.page, filters?.recordPerPage);
  }

  async getLowStock(filters?: ProductFilterParams) {
    return this.unitOfWork.Product.findLowStock(filters, filters?.page, filters?.recordPerPage);
  }

  async getById(id: number): Promise<ProductResponseDto | null> {
    const product = await this.unitOfWork.Product.findById(id);
    if (!product) throw new NotFoundError("Product not found");
    return product;
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
        lowStockThreshold: data.lowStockThreshold || 5,
        categoryId: data.categoryId,
        status: data.status || StatusEnum.Published,
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

      // Price/cost live in ProductVariant, so a price edit appends a new active
      // variant — but only when the value actually changed, to avoid piling up
      // identical rows on every unrelated save.
      if (data.sellingPrice != null) {
        const current = await this.unitOfWork.ProductVariant.getEffectiveOn(id, new Date(), transactionClient);
        const newCost = data.costPrice ?? null;
        const priceChanged = current == null || Number(current.sellingPrice) !== Number(data.sellingPrice);
        const costChanged = current != null && Number(current.costPrice ?? NaN) !== Number(newCost ?? NaN);

        if (priceChanged || costChanged) {
          await this.recordPricedVariant(
            {
              productId: id,
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

      // Stock is the sum of stockHistory movements, so an absolute stock value
      // from the form is recorded as the delta needed to reach it.
      if (data.stock != null) {
        const currentStock = await this.unitOfWork.Product.getCurrentStock(id, transactionClient);
        const delta = data.stock - currentStock;
        if (delta !== 0) {
          await this.unitOfWork.Product.createStockHistory(
            {
              productId: id,
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

  async delete(id: number): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.Product.delete(id);
  }

  /**
   * Books stock against one variant. Stock is held per variant - Small and Large keep
   * their own counts - so the movement records which variant it belongs to and the
   * variant's `stockQuantity` cache is recomputed from the movements afterwards.
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

      await this.unitOfWork.ProductVariant.syncVariantStock(data.variantId, transactionClient);

      // An optional price change goes to this variant's ledger rather than spawning
      // another variant row, which is what the old product-level flow did.
      if (data.sellingPrice !== undefined) {
        await this.unitOfWork.PriceHistory.create(
          {
            variantId: data.variantId,
            sellingPrice: data.sellingPrice,
            costPrice: data.costPrice ?? null,
            reason: data.reason ?? null,
          },
          transactionClient
        );
        await this.unitOfWork.PriceHistory.syncVariantPrice(data.variantId, transactionClient);
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
