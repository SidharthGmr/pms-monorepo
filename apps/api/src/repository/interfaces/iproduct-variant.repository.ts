import { Prisma } from '@prisma/client';
import { ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { CreateProductVariantModel } from '../../models/product-variant.model';

export interface IProductVariantRepository {
  /**
   * Creates a real variant (a size, a colour). It carries no price or stock of its own -
   * the caller books those into PriceHistory and stockHistory afterwards. Accepts an
   * optional transaction client so it can run inside the product create/update transaction.
   */
  create(data: CreateProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto>;

  /** On-hand stock for a variant, summed from its stockHistory movements. */
  getVariantStock(variantId: number, tx?: Prisma.TransactionClient): Promise<number>;

  /** One variant with its current price and stock attached. */
  findById(id: number, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  /** Every sellable variant of a product - Small, Medium and Large all stay active. */
  getActive(productId: number, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto[]>;

  /**
   * A variant priced as at a given date, for pricing a backdated sale. Resolves against the
   * PriceHistory ledger, since the variant row itself no longer holds a price.
   */
  getEffectiveOn(variantId: number, date: Date, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto | null>;

  /** Paginated list of a product's variants, newest first. */
  getHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductVariantResponseDto>>;
}
