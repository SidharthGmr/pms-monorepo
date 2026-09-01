import { PageFilterParams } from './page.params';


export interface ProductVariantFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  productId?: number;
  productIds?: string;
  categoryId?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}
