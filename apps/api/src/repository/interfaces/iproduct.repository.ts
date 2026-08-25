import { Prisma } from '@prisma/client';
import { ProductDetailResponseDto, ProductResponseDto, ProductWithPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { ProductFilterParams } from '../../params/product.params';

export interface IProductRepository {
  findAll(filters?: ProductFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<ProductResponseDto>>;




  findLowStock(filters?: ProductFilterParams, page?: number, limit?: number): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  /** Detail view: includes related names plus the current price and on-hand stock. */
  /** One product with related names. Price and stock are per variant, so neither is here. */
  findById(id: number): Promise<ProductDetailResponseDto | null>;
  delete(id: number, userId: string): Promise<ProductResponseDto>;

  /** Current on-hand stock: the sum of all stockHistory movements for a product. */
  getCurrentStock(productId: number, tx?: Prisma.TransactionClient): Promise<number>;

  /** Current on-hand stock for one variant: the sum of movements booked against it. */
  getVariantStock(variantId: number, tx?: Prisma.TransactionClient): Promise<number>;

  /**
   * Appends a stock movement (positive = add) to the append-only stockHistory table.
   * `variantId` says which variant the movement belongs to; it is optional because the
   * order and purchase flows are still product-keyed.
   */
  createStockHistory(
    data: { productId: number; variantId?: number | null; storeCode: string; userId: string; quantity: number; reason?: string | null },
    tx?: Prisma.TransactionClient
  ): Promise<void>;

  /**
   * Paginated stock movement history for a product, newest first (includes the acting
   * user and the variant). Pass `variantId` to narrow it to a single variant.
   */
  getStockHistory(productId: number, page?: number, limit?: number, variantId?: number): Promise<ListResponseDto<any>>;
}
