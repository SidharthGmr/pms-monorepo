import { Prisma } from '@prisma/client';
import { ListResponseDto, ProductVariantListItemDto, ProductVariantResponseDto, ProductVariantInternalDto, VariantRatingDto, ProductVariantFilterParams } from '@pms/types';
export interface IProductVariantRepository {
  findAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>>;

  getVariantStock(variantId: number, tx?: Prisma.TransactionClient): Promise<number>;

  findDetailById(id: number, storeCode: string, tx?: Prisma.TransactionClient): Promise<ProductVariantListItemDto | null>;

  rate(id: number, rating: number, userId: string, storeCode: string, tx?: Prisma.TransactionClient): Promise<VariantRatingDto>;

  findById(id: number, tx?: Prisma.TransactionClient): Promise<ProductVariantInternalDto | null>;

  /** Pass `storeCode` to refuse a product that belongs to another store. */
  getActive(productId: number, tx?: Prisma.TransactionClient, storeCode?: string): Promise<ProductVariantResponseDto[]>;

  getEffectiveOn(variantId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductVariantResponseDto>>;
}
