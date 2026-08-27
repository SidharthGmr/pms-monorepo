// Mirrors the API's ProductVariant rows (`/product-variants/...`).
// A variant is a sellable combination (size/colour/...); its price lives in the
// PriceHistory ledger and the price fields here cache the currently effective row.
export interface ProductVariantDto {
  id: number;
  productId: number;
  /** Generated when the variant is recorded if not supplied; unique across the table. */
  sku?: string;
  /** Human-friendly display name, e.g. "Large / Red". */
  name?: string | null;
  barcode?: string | null;
  description?: string | null;
  /** Alert when this variant's stock falls below this value. */
  lowStockThreshold?: number | null;
  /** Image URLs for this specific variant. */
  images?: string[];
  /** e.g. `{ size: 'L', color: 'Red' }`. Empty for rows created by a bare price change. */
  attributes?: Record<string, string | number | boolean> | null;
  stockQuantity?: number;
  storeCode: string;
  sellingPrice: number;
  costPrice: number | null;
  effectiveFrom: Date;
  isActive: boolean;
  reason: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt?: Date | null;
}

/**
 * A row of the store-wide SKU list (`GET /product-variants`). Read across products, so each
 * row names the product it belongs to. `sellingPrice` is null when the variant has never
 * been priced - distinct from a price of zero.
 */
export interface ProductVariantListItemDto extends Omit<ProductVariantDto, 'sellingPrice' | 'effectiveFrom' | 'reason'> {
  name?: string | null;
  barcode?: string | null;
  sellingPrice: number | null;
  compareAtPrice?: number | null;
  lowStockThreshold?: number | null;
  images?: string[];
  product: {
    id: number;
    name: string;
    slug: string;
    categoryId: number;
    /** Storefront fallback when the variant has no photo of its own. */
    images?: string[];
    category?: { name: string; images?: string[] } | null;
  };
}
