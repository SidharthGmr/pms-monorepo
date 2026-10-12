import { PageFilterParams } from './page.params';


export interface ProductVariantFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  sku?: string;
  productId?: number;
  productIds?: string;
  categoryId?: number;
  categoryIds?: string;
  brandNameId?: number;
  brandNameIds?: string;
  isActive?: boolean;
  storeCode?: string;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
}
