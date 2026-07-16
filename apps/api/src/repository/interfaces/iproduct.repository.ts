import { ProductResponseDto, ProductWithPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { ProductFilterParams } from '../../params/product.params';

export interface IProductRepository {
  findAll(filters?: ProductFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  findById(id: number): Promise<ProductResponseDto | null>;
  delete(id: number): Promise<ProductResponseDto>;
}
