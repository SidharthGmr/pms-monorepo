import { PageFilterParams } from './page.params';


export interface ProductVariantFilterParams extends PageFilterParams {
  productId?: number;
  productIds?: number[];
  categoryId?: number;
  isActive?: boolean;
  publishedOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
