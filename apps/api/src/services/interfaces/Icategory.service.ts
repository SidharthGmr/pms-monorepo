import { CategoryFilterParams, CategoryModel, CategoryResponseDto, ListResponseDto } from "@pms/types";


export interface ICategoryService {
  getAll(filters?: CategoryFilterParams): Promise<ListResponseDto<CategoryResponseDto>>;
  getById(id: number, storeCode: string): Promise<CategoryResponseDto | null>;
  create(data: CategoryModel, storeCode: string): Promise<CategoryResponseDto>;
  update(id: number, data: CategoryModel, storeCode: string): Promise<CategoryResponseDto>;
  delete(id: number, storeCode: string): Promise<CategoryResponseDto>;
}
