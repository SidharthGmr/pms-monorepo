import { Prisma } from '@prisma/client';
import { ProductPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { CreateProductPriceModel } from '../../models/product-price.model';

export interface IProductPriceRepository {
  /**
   * Appends a new price row for a product. The previously active row (if any)
   * is deactivated (isActive = false) and the new row becomes the active one.
   * Accepts an optional transaction client so it can run inside the product
   * create/update transaction.
   */
  create(data: CreateProductPriceModel, tx?: Prisma.TransactionClient): Promise<ProductPriceResponseDto>;

  /** The currently active price row for a product (isActive = true). */
  getActive(productId: number, tx?: Prisma.TransactionClient): Promise<ProductPriceResponseDto | null>;

  /**
   * The price that was effective on a given date: the row with the greatest
   * effectiveFrom that is <= date. Used at sale time to resolve the unit price.
   */
  getEffectiveOn(productId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductPriceResponseDto | null>;

  /** Paginated price-change history for a product, newest first. */
  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductPriceResponseDto>>;
}
