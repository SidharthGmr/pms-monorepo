import { Prisma } from '@prisma/client';

export interface CreateProductVariantModel {
  productId: number;
  storeCode: string;
  /**
   * `attributes` and `sku` are NOT NULL in the schema but tedious to supply for a
   * single-variant product, so the repository fills them in when omitted.
   */
  attributes?: Prisma.InputJsonValue; // e.g. { "size": "L", "color": "Red" }
  sku?: string;
  /** Display name for the variant, e.g. "Large / Red". */
  name?: string | null;
  barcode?: string | null;
  /** Image URLs for this specific variant. */
  images?: string[];
  /** Stock sits on the variant, so its low-stock trigger does too. */
  lowStockThreshold?: number | null;
  /** Opening stock, booked as the variant's first stockHistory movement. */
  stockQuantity?: number;
  /** Written to the PriceHistory ledger, which is the only place a price is stored. */
  sellingPrice: number;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom?: Date;
  reason?: string | null;
  createdById: string;
}

/**
 * Full in-place edit of a variant. The plain columns (name, sku, barcode, attributes,
 * images, threshold, active) are written directly. Price and stock are NOT columns:
 *   - a changed `sellingPrice`/`costPrice` is appended as a new PriceHistory entry (reprice),
 *   - a changed `stockQuantity` (target on-hand) is booked as a stockHistory adjustment.
 * The service resolves both against the current values so history stays intact.
 */
export interface UpdateProductVariantModel {
  name?: string | null;
  sku?: string;
  barcode?: string | null;
  attributes?: Prisma.InputJsonValue;
  images?: string[];
  lowStockThreshold?: number | null;
  isActive?: boolean;
  /** Reprice: appended to the ledger when it differs from the current effective price. */
  sellingPrice?: number | null;
  costPrice?: number | null;
  effectiveFrom?: Date;
  /** Target on-hand stock; a delta movement is booked to reach it. */
  stockQuantity?: number | null;
  reason?: string | null;
  updatedById: string;
}
