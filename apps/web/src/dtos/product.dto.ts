import { ProductPriceDto } from './product-price.dto';

export interface ProductDto {
  id: number;
  name: string;
  slug: string;
  brandNameId?: number | null;
  description?: string | null;
  price: number;
  cost?: number | null;
  stock: number;
  prices?: ProductPriceDto[];
  currentPrice?: ProductPriceDto | null;
  lowStockThreshold?: number | null;
  categoryId: number;
  parentId?: number | null;
  attributeId?: number | null;
  storeCode: string;
  storeId?: number | null;
  images: string[];
  createdById: number;
  updatedById?: number | null;
  createdAt: Date;
  displayOrder?: number | null;
  updatedAt: Date | null;
  status?: string;
}
