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

/**
 * A product row as returned by `GET /products`.
 *
 * Money and stock are deliberately absent: price lives in the PriceHistory ledger and stock
 * is the sum of the stockHistory movements, both held per variant. Screens that need either
 * resolve them from `/product-variants` via `useProductPricing`.
 */
export interface ProductDto {
  id: number;
  name: string;
  slug: string;
  brandNameId?: number | null;
  description?: string | null;
  categoryId: number;
  /** Resolved category name - the detail and low-stock endpoints send it, the list does not. */
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
