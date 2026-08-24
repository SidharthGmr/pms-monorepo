/**
 * A sellable variant of a product, as returned inline on the paginated product list.
 * Prices cache the variant's currently effective PriceHistory row.
 */
export interface ProductVariantSummaryDto {
  id: number;
  sku: string;
  /** e.g. `{ size: 'L', color: 'Red' }`. Empty for rows created by a bare price change. */
  attributes?: Record<string, string | number | boolean> | null;
  stockQuantity: number;
  sellingPrice: number;
  costPrice: number | null;
}

export interface ProductDto {
  id: number;
  name: string;
  slug: string;
  brandNameId?: number | null;
  description?: string | null;
  price: number;
  cost?: number | null;
  stock: number;
  /** Active variants, populated by the paginated list endpoint only. */
  variants?: ProductVariantSummaryDto[];
  currentPrice?: Pick<ProductVariantSummaryDto, 'sellingPrice' | 'costPrice'> | null;
  lowStockThreshold?: number | null;
  categoryId: number;
  /** Resolved category name, sent by the list endpoints alongside `categoryId`. */
  category?: string | null;
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
