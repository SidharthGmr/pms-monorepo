// Mirrors the API's ProductVariant rows (`/product-variants/...`).
// A variant is a sellable combination (size/colour/...). Price is NOT a column on it: the
// fields here are resolved from the effective PriceHistory row on every read, so they are
// null for a variant that has never been priced.
export interface ProductVariantDto {
  id: number;
  productId: number;
  /** Generated when the variant is recorded if not supplied; unique across the table. */
  sku?: string;
  /** Human-friendly display name, e.g. "Large / Red". */
  name?: string | null;
  barcode?: string | null;
  description?: string | null;
  /** Average stars across this variant's ratings; null until the first one. */
  rating?: number | null;
  ratingCount?: number | null;
  /** Alert when this variant's stock falls below this value. */
  lowStockThreshold?: number | null;
  /** Image URLs for this specific variant. */
  images?: string[];
  /**
   * The variant's defining attributes as master-data id pairs, e.g. `[{ attributeid: 3,
   * attributeValueId: 12 }]` for Size = L. Empty for rows created by a bare price change.
   * The record form is what rows written before the id migration still hold - read it with
   * `toAttributeRows` (`features/product-variants/add-edit/attribute-rows`) rather than
   * assuming either shape.
   */
  attributes?: ProductVariantAttributeDto[] | Record<string, string | number | boolean> | null;
  stockQuantity?: number;
  storeCode: string;
  sellingPrice: number;
  /** Promotional amount on the effective ledger row; null when none is set. */
  offerPrice?: number | null;
  /** Whether the offer is live. What you pay is `isOffer && offerPrice != null ? offerPrice : sellingPrice`. */
  isOffer?: boolean;
  costPrice: number | null;
  effectiveFrom: Date;
  isActive: boolean;
  reason: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt?: Date | null;
}

/** One `{ attribute, value }` pair on a variant, both sides being master-data ids. */
export interface ProductVariantAttributeDto {
  attributeid: number;
  attributeValueId: number;
}

/**
 * The store-wide SKU list row. Re-exported from the shared package so
 * `@/dtos/product-variant.dto` resolves to the single source of truth, matching `UserDto.ts`.
 */
export type { ProductVariantListItemDto } from '@pms/types';
