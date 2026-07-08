import { CategoryDto } from "../../dtos/category.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { CategoryModel } from "../../models/category.model";
import { CategoryFilterParams } from "../../params/category.params";

export interface ICategoryService {
  getAll(filters?: CategoryFilterParams): Promise<ListResponseDto<CategoryDto>>;
  getById(id: number): Promise<CategoryDto | null>;
  create(data: CategoryModel, storeCode: string): Promise<CategoryDto>;
  update(id: number, data: CategoryModel): Promise<CategoryDto>;
  delete(id: number): Promise<CategoryDto>;
}
