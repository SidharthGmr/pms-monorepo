import { PageFilterParams } from './page.params';


export interface ProductVariantFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  productId?: number;
  productIds?: string;
  categoryId?: number;
  categoryIds?: string;
  brandNameId?: number;
  brandNameIds?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}
