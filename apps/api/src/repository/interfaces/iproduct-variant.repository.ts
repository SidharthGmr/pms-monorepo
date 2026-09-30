import { Prisma } from '@prisma/client';
import { ProductVariantListItemDto, ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { ProductVariantInternalDto, VariantRatingDto } from '../../dtos/product-variant.dto';
import { ProductVariantFilterParams } from '../../params/product-variant.params';

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
