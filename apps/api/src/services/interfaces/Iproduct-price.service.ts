import { Prisma } from '@prisma/client';
import { ProductPriceResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { CreateProductPriceModel } from '../../models/product-price.model';

export interface IProductPriceService {
  /** Record a new price for a product (append-only history). */
  record(data: CreateProductPriceModel, tx?: Prisma.TransactionClient): Promise<ProductPriceResponseDto>;

  /** Resolve the price effective on a given date for a product. */
  getEffectiveOn(productId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductPriceResponseDto | null>;

  /** Paginated price-change history, store-scoped. */
  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductPriceResponseDto>>;
}
