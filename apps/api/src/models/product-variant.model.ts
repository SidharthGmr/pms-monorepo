import { Prisma, Status } from '@prisma/client';

export interface CreateProductVariantModel {
  productId: number;
  storeCode: string;
  attributes?: Prisma.InputJsonValue; // e.g. { "size": "L", "color": "Red" }
  sku?: string;
  name?: string | null;
  /** Presentational only - `sku` is the unique handle (`@@unique([storeCode, sku])`). */
  slug?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: Status;
  isFeatured?: boolean;
  barcode?: string | null;
  images?: string[];
  lowStockThreshold?: number | null;
  stockQuantity?: number;
  /**
   * Null means "not priced yet", which is distinct from a price of zero - no PriceHistory
   * row is filed at all in that case, and the variant reads back as unpriced.
   */
  sellingPrice: number | null;
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
