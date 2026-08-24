/**
 * This package intentionally has no @prisma/client dependency, so it declares its own
 * JSON value type. It is structurally compatible with Prisma's `JsonValue`, which is
 * what the API assigns to it. (The global `JSON` is the parse/stringify object, not a
 * value type, so it can never describe a Json column.)
 */
export type JsonObject = { [key: string]: JsonValue | undefined };
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface ProductVariantResponseDto {
  id: number;
  productId: number;
  storeCode: string;
  sku: string;
  name: string | null;
  barcode: string | null;
  attributes: JsonValue;
  /** Variant-specific photos; the storefront falls back to the product's when empty. */
  images: string[];
  /** Summed from the variant's stockHistory movements - not a stored column. */
  stockQuantity: number;
  /**
   * Resolved from the variant's currently effective PriceHistory row, which is the only
   * place a price is stored. Null when the variant has never been priced - distinct from a
   * price of zero.
   */
  sellingPrice: number | null;
  costPrice: number | null;
  compareAtPrice: number | null;
  lowStockThreshold: number | null;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
}

/**
 * A variant as it appears in the store-wide SKU list, where rows are read across products
 * rather than within one - so each row has to say which product it belongs to.
 */
export interface ProductVariantListItemDto extends ProductVariantResponseDto {
  product: {
    id: number;
    name: string;
    slug: string;
    categoryId: number;
    /** Carried for the storefront card; the admin list ignores both. */
    images?: string[];
    category?: { name: string; images?: string[] } | null;
  };
}
