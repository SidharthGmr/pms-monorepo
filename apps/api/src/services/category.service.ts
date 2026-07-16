import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { CategoryDto } from "../dtos/category.dto";
import NotFoundError from "../exceptions/not-found-error";
import { CategoryModel } from "../models/category.model";
import { CategoryFilterParams } from "../params/category.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { ICategoryService } from "./interfaces/Icategory.service";
import { ListResponseDto, StatusEnum } from "@pms/types";

@injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }

  async getAll(filters?: CategoryFilterParams): Promise<ListResponseDto<CategoryDto>> {
    return this.unitOfWork.Category.findAll(filters);
  }

  async getById(id: number): Promise<CategoryDto | null> {
    const category = await this.unitOfWork.Category.findById(id);
    if (!category) throw new NotFoundError("Category not found");
    return category;
  }


  async create(data: CategoryModel, storeCode: string): Promise<CategoryDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const category = await transactionClient.category.create({
        data: {
          name: data.name,
          description: data.description || null,
          parentId: data.parentId || null,
          storeCode: storeCode,
          status: data.status || StatusEnum.Draft,
        },
      });
      return category;
    });
  }

  async update(id: number, data: CategoryModel): Promise<CategoryDto> {
    const existing = await this.unitOfWork.Category.findById(id);
    if (!existing) throw new NotFoundError("Category not found");
    return this.unitOfWork.transaction(async (transactionClient) => {
      const category = await transactionClient.category.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          parentId: data.parentId || null,
          storeCode: data.storeCode,
          status: data.status || StatusEnum.Draft,
          updatedAt: new Date(),
        },
      });
      return category;
    });
  }

  async delete(id: number): Promise<CategoryDto> {
    const existing = await this.unitOfWork.Category.findById(id);
    if (!existing) throw new NotFoundError("Category not found");
    return this.unitOfWork.Category.delete(id);
  }
}
