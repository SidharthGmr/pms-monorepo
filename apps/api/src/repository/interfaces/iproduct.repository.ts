import { Prisma } from '@prisma/client';
import { ProductResponseDto, ProductWithPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { ProductFilterParams } from '../../params/product.params';

export interface IProductRepository {
  findAll(filters?: ProductFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  findById(id: number): Promise<ProductResponseDto | null>;
  delete(id: number): Promise<ProductResponseDto>;

  /** Appends a stock movement (positive = add) to the append-only stockHistory table. */
  createStockHistory(
    data: { productId: number; storeCode: string; userId: string; quantity: number; reason?: string | null },
    tx?: Prisma.TransactionClient
  ): Promise<void>;

  /** Paginated stock movement history for a product, newest first (includes the acting user). */
  getStockHistory(productId: number, page?: number, limit?: number): Promise<ListResponseDto<any>>;
}
