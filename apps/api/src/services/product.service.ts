import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ProductResponseDto } from "../dtos/product.dto";
import { Status } from "../enum/status.enum";
import NotFoundError from "../exceptions/not-found-error";
import { CreateProductModel } from "../models/product.model";
import { ProductFilterParams } from "../params/product.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IProductService } from "./interfaces/Iproduct.service";

@injectable()
export class ProductService implements IProductService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }

  async getAll(filters?: ProductFilterParams) {
    return this.unitOfWork.Product.findAll(filters, filters?.page, filters?.recordPerPage);
  }

  async getById(id: number): Promise<ProductResponseDto | null> {
    const product = await this.unitOfWork.Product.findById(id);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  async getBySlug(slug: string): Promise<ProductResponseDto | null> {
    const product = await this.unitOfWork.Product.findBySlug(slug);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  async getLowStockProducts(storeCode: string, page = 1, limit = 10) {
    return this.unitOfWork.Product.getLowStockProducts(storeCode, page, limit);
  }

  async create(data: CreateProductModel, userId: string, storeCode: string): Promise<ProductResponseDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const storeData = await transactionClient.product.create({
        data: {
          name: data.name,
          brandNameId: data.brandNameId || null,
          attributeId: data.attributeId || null,
          parentId: data.parentId || null,
          categoryId: data.categoryId,
          createdById: userId,
          slug: data.slug,
          description: data.description || null,
          price: data.price,
          cost: data.cost || null,
          stock: data.stock || 0,
          lowStockThreshold: data.lowStockThreshold || 5,
          storeCode: storeCode,
          status: data.status || Status.Draft,
          images: data.images ?? [],
        },
      });
      return storeData;
    });
  }

  async update(id: number, data: CreateProductModel, userId: string, storeCode: string): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.transaction(async (transactionClient) => {
      const updateData: any = {
        name: data.name,
        brandNameId: data.brandNameId || null,
        attributeId: data.attributeId || null,
        slug: data.slug,
        description: data.description || null,
        price: data.price,
        cost: data.cost || null,
        stock: data.stock || 0,
        lowStockThreshold: data.lowStockThreshold || 5,
        categoryId: data.categoryId,
        status: data.status || Status.Published,
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
      return storeData;
    });
  }

  async addStock(id: number, quantity: number, userId: string, storeCode: string, reason?: string): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    if (existing.storeCode !== storeCode) throw new Error("Product does not belong to your store");
    return this.unitOfWork.Product.addStock(id, quantity, userId, storeCode, reason);
  }

  async getStockHistory(productId: number, storeCode: string, page = 1, limit = 10) {
    const existing = await this.unitOfWork.Product.findById(productId);
    if (!existing) throw new NotFoundError("Product not found");
    if (existing.storeCode !== storeCode) throw new Error("Product does not belong to your store");
    return this.unitOfWork.Product.getStockHistory(productId, storeCode, page, limit);
  }

  async delete(id: number): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.Product.delete(id);
  }
}
