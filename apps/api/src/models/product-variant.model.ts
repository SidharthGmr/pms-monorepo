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
