import { Prisma } from '@prisma/client';
import { ProductVariantListItemDto, ProductVariantModel, ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { CreateProductVariantModel, UpdateProductVariantModel } from '../../models/product-variant.model';
import { ProductVariantFilterParams } from '../../params/product-variant.params';

export interface IProductVariantService {
  /** Store-wide SKU list, across every product. */
  getAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>>;
  create(data: ProductVariantModel, userId: string, storeCode: string): Promise<ProductVariantResponseDto>;


  /** Create a variant, file its opening price in the ledger and book any opening stock. */
  //record(data: CreateProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto>;

  /** Edit a variant's safe fields (name, sku, barcode, threshold, active). Store-scoped. */
  update(id: number, storeCode: string, data: UpdateProductVariantModel): Promise<ProductVariantResponseDto>;

  /** Resolve a variant priced as at a given date. */
  getEffectiveOn(variantId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  /** Paginated list of a product's variants, store-scoped. */
  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductVariantResponseDto>>;
}
