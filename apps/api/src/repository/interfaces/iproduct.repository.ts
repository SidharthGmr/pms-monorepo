import { Prisma } from '@prisma/client';
import { ProductDetailResponseDto, ProductResponseDto, ProductWithPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { ProductFilterParams } from '../../params/product.params';

export interface IProductRepository {
  findAll(filters?: ProductFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<ProductResponseDto>>;
  findById(id: number): Promise<ProductDetailResponseDto | null>;
  delete(id: number, userId: string): Promise<ProductResponseDto>;




  findLowStock(filters?: ProductFilterParams, page?: number, limit?: number): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  getCurrentStock(productId: number, tx?: Prisma.TransactionClient): Promise<number>;
  getVariantStock(variantId: number, tx?: Prisma.TransactionClient): Promise<number>;

  createStockHistory(
    data: { productId: number; variantId?: number | null; storeCode: string; userId: string; quantity: number; reason?: string | null },
    tx?: Prisma.TransactionClient
  ): Promise<void>;

  getStockHistory(productId: number, page?: number, limit?: number, variantId?: number): Promise<ListResponseDto<any>>;
}
