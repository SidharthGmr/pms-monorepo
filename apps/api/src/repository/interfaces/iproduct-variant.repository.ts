import { Prisma } from '@prisma/client';
import { ProductVariantListItemDto, ProductVariantModel, ProductVariantResponseDto } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { ProductVariantInternalDto, VariantRatingDto } from '../../dtos/product-variant.dto';
import { CreateProductVariantModel, UpdateProductVariantModel } from '../../models/product-variant.model';
import { ProductVariantFilterParams } from '../../params/product-variant.params';

export interface IProductVariantRepository {
  /**
   * Every variant in the store, across products - the SKU list. Each row carries the product
   * it belongs to, plus its effective price and on-hand stock.
   */
  findAll(filters?: ProductVariantFilterParams): Promise<ListResponseDto<ProductVariantListItemDto>>;

  /**
   * Creates a real variant (a size, a colour). It carries no price or stock of its own -
   * the caller books those into PriceHistory and stockHistory afterwards. Accepts an
   * optional transaction client so it can run inside the product create/update transaction.
   */
  create(data: ProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto>;

  /** On-hand stock for a variant, summed from its stockHistory movements. */
  getVariantStock(variantId: number, tx?: Prisma.TransactionClient): Promise<number>;

  /**
   * One variant in the response shape (with its parent product), scoped to the store. Returns
   * null for a variant belonging to another store, so callers need no extra ownership check.
   */
  findDetailById(id: number, storeCode: string, tx?: Prisma.TransactionClient): Promise<ProductVariantListItemDto | null>;

  /**
   * Records a user's star rating and recomputes the variant's average and count from the
   * rating rows. Pass the caller's `tx` so the vote and the aggregate commit together.
   */
  rate(id: number, rating: number, userId: string, storeCode: string, tx?: Prisma.TransactionClient): Promise<VariantRatingDto>;

  /**
   * One variant with its current price and stock attached, in the **internal** shape: it also
   * carries `productId` and `storeCode`, which the store-ownership guards and the
   * `stockHistory` foreign key need. Those two are not part of the API response - strip them
   * with `toVariantResponse` (`dtos/product-variant.dto.ts`) before returning to a client.
   */
  findById(id: number, tx?: Prisma.TransactionClient): Promise<ProductVariantInternalDto | null>;

  /**
   * Updates a variant's "safe" fields (name, sku, barcode, low-stock threshold, active
   * flag). Price and attributes are intentionally not editable here.
   */
  update(id: number, data: UpdateProductVariantModel, tx?: Prisma.TransactionClient): Promise<ProductVariantResponseDto>;

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
