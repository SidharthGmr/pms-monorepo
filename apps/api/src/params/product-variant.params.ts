import { PageFilterParams } from './page.params';


export interface ProductVariantFilterParams extends PageFilterParams {
  /** Exact SKU, case-insensitive; the storefront detail page looks a variant up by it. */
  sku?: string;
  productId?: number;
  productIds?: number[];
  categoryId?: number;
  categoryIds?: number[];
  brandNameId?: number;
  brandNameIds?: number[];
  isActive?: boolean;
  isFeatured?: boolean;
  publishedOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
