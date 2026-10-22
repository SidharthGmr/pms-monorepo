import { PageFilterParams } from './page.params';

export interface ProductVariantFilterParams extends PageFilterParams {
  /** Exact SKU, case-insensitive; the storefront detail page looks a variant up by it. */
  sku?: string;
  productId?: number;
  /** Comma-separated over the wire, an array once parsed by the API. */
  productIds?: number[] | string;
  categoryId?: number;
  categoryIds?: number[] | string;
  brandNameId?: number;
  brandNameIds?: number[] | string;
  isActive?: boolean;
  isFeatured?: boolean;
  publishedOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
