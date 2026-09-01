import { Prisma } from '@prisma/client';
import { ProductVariantListItemDto, ProductVariantModel, ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { VariantRatingDto } from '../../dtos/product-variant.dto';
import { CreateProductVariantModel, UpdateProductVariantModel } from '../../models/product-variant.model';
import { ProductVariantFilterParams } from '../../params/product-variant.params';

export interface IProductVariantService {
  create(data: ProductVariantModel, userId: string, storeCode: string): Promise<ProductVariantResponseDto>;
  getAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>>;

  /**
   * Rate a variant 1-5 stars as the signed-in user. Re-rating replaces that user's previous
   * score; the variant's average and count are recomputed in the same transaction.
   */
  rate(id: number, rating: number, userId: string, storeCode: string): Promise<VariantRatingDto>;

  /** One variant with its parent product, for the edit screen. Store-scoped. */
  getById(id: number, storeCode: string): Promise<ProductVariantListItemDto>;



  /** Create a variant, file its opening price in the ledger and book any opening stock. */
  //record(data: CreateProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto>;

  /** Edit a variant's safe fields (name, sku, barcode, threshold, active). Store-scoped. */
  update(id: number, storeCode: string, data: UpdateProductVariantModel): Promise<ProductVariantResponseDto>;

  /** Resolve a variant priced as at a given date. */
  getEffectiveOn(variantId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  /** Paginated list of a product's variants, store-scoped. */
  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductVariantResponseDto>>;
}
