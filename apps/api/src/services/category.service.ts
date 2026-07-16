import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import NotFoundError from "../exceptions/not-found-error";

import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { ICategoryService } from "./interfaces/Icategory.service";
import { CategoryFilterParams, CategoryModel, CategoryResponseDto, ListResponseDto, StatusEnum } from "@pms/types";

@injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }

  async getAll(filters?: CategoryFilterParams): Promise<ListResponseDto<CategoryResponseDto>> {
    return this.unitOfWork.Category.findAll(filters);
  }

  async getById(id: number, storeCode: string): Promise<CategoryResponseDto | null> {
    const category = await this.unitOfWork.Category.findById(id, storeCode);
    if (!category) throw new NotFoundError("Category not found");
    return category;
  }


  async create(data: CategoryModel, storeCode: string): Promise<CategoryResponseDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const category = await transactionClient.category.create({
        data: {
          name: data.name,
          description: data.description || null,
          parentId: data.parentId || null,
          storeCode: storeCode,
          status: data.status || StatusEnum.Draft,
          displayOrder: data.displayOrder || null
        },
      });
      return category;
    });
  }

  async update(id: number, data: CategoryModel, storeCode: string): Promise<CategoryResponseDto> {
    const existing = await this.unitOfWork.Category.findById(id, storeCode);
    if (!existing) throw new NotFoundError("Category not found");
    return this.unitOfWork.transaction(async (transactionClient) => {
      const category = await transactionClient.category.update({
        where: { id, storeCode },
        data: {
          name: data.name,
          description: data.description || null,
          parentId: data.parentId || null,
          storeCode: data.storeCode,
          status: data.status || StatusEnum.Draft,
          displayOrder: data.displayOrder || null,
          updatedAt: new Date(),
        },
      });
      return category;
    });
  }

  async delete(id: number, storeCode: string): Promise<CategoryResponseDto> {
    const existing = await this.unitOfWork.Category.findById(id, storeCode);
    if (!existing) throw new NotFoundError("Category not found");
    return this.unitOfWork.Category.delete(id);
  }
}
