import { PageFilterParams } from './page.params';


export interface ProductVariantFilterParams extends PageFilterParams {
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
