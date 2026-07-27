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
  currentPrice?: Pick<ProductVariantDto, 'sellingPrice' | 'costPrice'> | null;
  lowStockThreshold?: number | null;
  categoryId: number;
  parentId?: number | null;
  attributeId?: number | null;
  storeCode: string;
  storeId?: number | null;
  images: string[];
  createdById: string;
  updatedById?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  displayOrder?: number | null;
  status?: string;
}
