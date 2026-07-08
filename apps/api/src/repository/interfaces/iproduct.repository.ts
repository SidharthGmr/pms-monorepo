import { ProductResponseDto } from '../../dtos/product.dto';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { ProductFilterParams } from '../../params/product.params';

export interface IProductRepository {
  findAll(filters?: ProductFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<ProductResponseDto>>;
  findById(id: number): Promise<ProductResponseDto | null>;
  findBySlug(slug: string): Promise<ProductResponseDto | null>;
  getLowStockProducts(storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductResponseDto>>;
  addStock(id: number, quantity: number, userId: string, storeCode: string, reason?: string): Promise<ProductResponseDto>;
  getStockHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<any>;
  delete(id: number): Promise<ProductResponseDto>;
}
