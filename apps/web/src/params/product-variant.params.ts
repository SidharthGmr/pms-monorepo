import { PageFilterParams } from './page.params';

/**
 * Filters for the store-wide SKU list. `startDate`/`endDate` filter on the variant's
 * `createdAt`, and travel as ISO strings since they go on the query string.
 */
export interface ProductVariantFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  /** Narrow to one product's variants. */
  productId?: number;
  /** Narrow to a category, resolved through the parent product. */
  categoryId?: number;
  /** Sellable variants only when true; retired ones only when false. */
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}
