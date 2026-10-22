import { Prisma } from '@prisma/client';
import { ListResponseDto, ProductVariantListItemDto, ProductVariantModel, ProductVariantResponseDto, VariantRatingDto, ProductVariantFilterParams } from '@pms/types';
export interface IProductVariantService {
  create(data: ProductVariantModel, userId: string, storeCode: string): Promise<ProductVariantResponseDto>;
  update(data: ProductVariantModel, id: number, storeCode: string): Promise<ProductVariantResponseDto>;

  getAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>>;
  getById(id: number, storeCode: string): Promise<ProductVariantListItemDto>;


  rate(id: number, rating: number, userId: string, storeCode: string): Promise<VariantRatingDto>;




  getEffectiveOn(variantId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductVariantResponseDto>>;
}
