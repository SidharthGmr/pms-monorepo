import { Prisma } from '@prisma/client';
import { ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { CreateProductVariantModel } from '../../models/product-variant.model';

export interface IProductVariantRepository {
  /**
   * Appends a new variant row for a product. The previously active row (if any)
   * is deactivated (isActive = false) and the new row becomes the active one.
   * Accepts an optional transaction client so it can run inside the product
   * create/update transaction.
   */
  create(data: CreateProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto>;

  /** The currently active variant row for a product (isActive = true). */
  getActive(productId: number, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  /**
   * The variant that was effective on a given date: the row with the greatest
   * effectiveFrom that is <= date. Used at sale time to resolve the unit price.
   */
  getEffectiveOn(productId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  /** Paginated variant-change history for a product, newest first. */
  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductVariantResponseDto>>;
}
