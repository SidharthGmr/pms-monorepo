// Mirrors the API's ProductVariant rows (`/product-variants/...`).
// A variant is a sellable combination (size/colour/...); its price lives in the
// PriceHistory ledger and the price fields here cache the currently effective row.
export interface ProductVariantDto {
  id: number;
  productId: number;
  /** Generated when the variant is recorded if not supplied; unique across the table. */
  sku?: string;
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
