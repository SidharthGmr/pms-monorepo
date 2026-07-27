import { ProductVariantDto } from './product-variant.dto';

export interface ProductDto {
  id: number;
  name: string;
  slug: string;
  brandNameId?: number | null;
  description?: string | null;
  price: number;
  cost?: number | null;
  stock: number;
  variants?: ProductVariantDto[];
  // The API exposes only the effective selling/cost price on list endpoints.
  currentPrice?: Pick<ProductVariantDto, 'sellingPrice' | 'costPrice'> | null;
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
