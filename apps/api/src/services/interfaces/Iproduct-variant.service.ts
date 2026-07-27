import { Prisma } from '@prisma/client';
import { ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { CreateProductVariantModel } from '../../models/product-variant.model';

export interface IProductVariantService {
  /** Record a new variant for a product (append-only history). */
  record(data: CreateProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto>;

  /** Resolve the variant effective on a given date for a product. */
  getEffectiveOn(productId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  /** Paginated variant-change history, store-scoped. */
  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductVariantResponseDto>>;
}
