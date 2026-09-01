import { Prisma, Status } from '@prisma/client';

export interface CreateProductVariantModel {
  productId: number;
  storeCode: string;
  attributes?: Prisma.InputJsonValue;
  sku?: string;
  name?: string | null;
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
  sellingPrice: number | null;
  offerPrice?: number | null;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom?: Date;
  reason?: string | null;
  isOffer?: boolean;
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
  /** Turns the promotion on or off. A plain column - it does not append a ledger row. */
  isOffer?: boolean;
  /** Reprice: appended to the ledger when it differs from the current effective price. */
  sellingPrice?: number | null;
  /** Part of the same reprice - a changed offer amount files a new ledger row too. */
  offerPrice?: number | null;
  costPrice?: number | null;
  effectiveFrom?: Date;
  /** Ends the repriced period; null leaves it open-ended as usual. */
  effectiveTo?: Date | null;
  /** Target on-hand stock; a delta movement is booked to reach it. */
  stockQuantity?: number | null;
  reason?: string | null;
  updatedById: string;
}
