import { Prisma } from '@prisma/client';
import { ProductVariantListItemDto, ProductVariantModel, ProductVariantResponseDto, UpdateProductVariantModel } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { VariantRatingDto } from '../../dtos/product-variant.dto';
import { ProductVariantFilterParams } from '../../params/product-variant.params';

export interface IProductVariantService {
  create(data: ProductVariantModel, userId: string, storeCode: string): Promise<ProductVariantResponseDto>;
  /**
   * A partial edit: every field is optional, so what is not sent keeps its current value.
   * `updatedById` is set by the controller from the token - the ledger and stock rows the
   * update writes need an author.
   */
  update(data: UpdateProductVariantModel, id: number, storeCode: string): Promise<ProductVariantResponseDto>;

  getAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>>;
  getById(id: number, storeCode: string): Promise<ProductVariantListItemDto>;


  rate(id: number, rating: number, userId: string, storeCode: string): Promise<VariantRatingDto>;




  getEffectiveOn(variantId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductVariantResponseDto>>;
}
