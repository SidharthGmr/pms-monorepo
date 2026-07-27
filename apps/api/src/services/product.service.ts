import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto, ProductModel, ProductResponseDto, StatusEnum } from "@pms/types";
import NotFoundError from "../exceptions/not-found-error";
import { ProductFilterParams } from "../params/product.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { AddStockModel, IProductService } from "./interfaces/Iproduct.service";




@injectable()
export class ProductService implements IProductService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }

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
        await this.unitOfWork.ProductVariant.create(
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
          await this.unitOfWork.ProductVariant.create(
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

  async addStock(id: number, data: AddStockModel, userId: string, storeCode: string): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");

    return this.unitOfWork.transaction(async (transactionClient) => {
      // Record the stock movement.
      await this.unitOfWork.Product.createStockHistory(
        {
          productId: id,
          storeCode,
          userId,
          quantity: data.quantity,
          reason: data.reason ?? null,
        },
        transactionClient
      );

      // Optionally update the product's price alongside the stock change.
      // A new active price row is only created when a selling price is supplied.
      if (data.sellingPrice !== undefined) {
        await this.unitOfWork.ProductVariant.create(
          {
            productId: id,
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

  async getStockHistory(id: number, page?: number, limit?: number): Promise<ListResponseDto<any>> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.Product.getStockHistory(id, page, limit);
  }

}
