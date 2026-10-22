
import { ListResponseDto, ProductResponseDto, LowStockItemDto, ProductFilterParams } from '@pms/types';
export interface IProductRepository {
  findAll(filters?: ProductFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<ProductResponseDto>>;
  findById(id: number): Promise<ProductResponseDto | null>;
  findLowStock(storeCode: string, limit?: number): Promise<ListResponseDto<LowStockItemDto>>;
  delete(id: number, userId: string): Promise<ProductResponseDto>;
}
