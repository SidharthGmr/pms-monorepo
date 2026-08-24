import { PageFilterParams } from './page.params';

/**
 * Filters for the store-wide variant list. `startDate`/`endDate` (from `PageFilterParams`)
 * filter on `createdAt` - when the variant was recorded, not when it was last priced.
 */
export interface ProductVariantFilterParams extends PageFilterParams {
  /** Narrow to one product's variants. */
  productId?: number;
  /** Narrow to a category, resolved through the parent product. */
  categoryId?: number;
  /** Sellable variants only when true; retired ones only when false. */
  isActive?: boolean;
  /**
   * Restricts to variants whose parent product is Published. The public storefront sets it;
   * the admin list leaves it off so drafts stay visible to staff.
   */
  publishedOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
