import { CategoryFilterParams, CategoryResponseDto, ListResponseDto } from "@pms/types";
export interface ICategoryRepository {
  findAll(filters?: CategoryFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<CategoryResponseDto>>;
  findById(id: number, storeCode: string): Promise<CategoryResponseDto | null>;
  delete(id: number): Promise<CategoryResponseDto>;
}
