import { CategoryFilterParams, CategoryResponseDto, ListResponseDto } from "@pms/types";
export interface ICategoryRepository {
  findAll(filters?: CategoryFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<CategoryResponseDto>>;
  findById(id: number, storeCode: string, includeDeleted?: boolean): Promise<CategoryResponseDto | null>;
  countChildren(id: number, storeCode: string): Promise<number>;
  countProducts(id: number, storeCode: string): Promise<number>;
  delete(id: number, storeCode: string, userId: string): Promise<CategoryResponseDto>;
}
