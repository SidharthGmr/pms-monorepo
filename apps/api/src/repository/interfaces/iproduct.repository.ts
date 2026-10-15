
import { ListResponseDto, ProductResponseDto } from '@pms/types';
import { LowStockItemDto } from '../../dtos/low-stock.dto';
import { ProductFilterParams } from '../../params/product.params';

export interface IProductRepository {
  findAll(filters?: ProductFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<ProductResponseDto>>;
  findById(id: number): Promise<ProductResponseDto | null>;
  findLowStock(storeCode: string, limit?: number): Promise<ListResponseDto<LowStockItemDto>>;
  delete(id: number, userId: string): Promise<ProductResponseDto>;
}
