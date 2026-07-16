import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ProductModel, ProductResponseDto, StatusEnum } from "@pms/types";
import NotFoundError from "../exceptions/not-found-error";
import { ProductFilterParams } from "../params/product.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IProductService } from "./interfaces/Iproduct.service";




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
          images: data.images ?? [],
        },
      });
      return productData;
    });
  }

  async getAll(filters?: ProductFilterParams) {
    return this.unitOfWork.Product.findAll(filters, filters?.page, filters?.recordPerPage);
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

      return storeData;
    });
  }

  async delete(id: number): Promise<ProductResponseDto> {
    const existing = await this.unitOfWork.Product.findById(id);
    if (!existing) throw new NotFoundError("Product not found");
    return this.unitOfWork.Product.delete(id);
  }
}
