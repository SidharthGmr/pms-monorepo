import { CategoryFilterParams, CategoryModel, CategoryResponseDto, ListResponseDto } from "@pms/types";

export interface ICategoryService {
  create(data: CategoryModel, storeCode: string, userId: string): Promise<CategoryResponseDto>;
  getAll(filters?: CategoryFilterParams): Promise<ListResponseDto<CategoryResponseDto>>;
  getById(id: number, storeCode: string): Promise<CategoryResponseDto>;
  update(id: number, data: CategoryModel, storeCode: string, userId: string): Promise<CategoryResponseDto>;
  delete(id: number, storeCode: string, userId: string): Promise<CategoryResponseDto>;
}
