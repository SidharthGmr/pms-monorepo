import { Prisma } from '@prisma/client';

export interface CreateProductVariantModel {
  productId: number;
  storeCode: string;
  /**
   * Both columns are NOT NULL in the schema, but a variant created as a side effect of a
   * price change has no real SKU or attribute set to hand. Left optional here; the
   * repository fills them in when omitted.
   */
  attributes?: Prisma.InputJsonValue; // e.g. { "size": "L", "color": "Red" }
  sku?: string;
  /** Opening stock held against this variant. Defaults to 0. */
  stockQuantity?: number;
  /**
   * Written to the PriceHistory ledger, which is the source of truth. The variant's own
   * price columns are NOT NULL, so they are seeded with the same figure and then kept in
   * step with the ledger.
   */
  sellingPrice: number;
  costPrice?: number | null;
  effectiveFrom?: Date;
  reason?: string | null;
  createdById: string;
  /**
   * Whether this row retires the product's other active variants.
   *
   * Defaults to `true`, which is the price-change behaviour every existing caller relies
   * on (a new price supersedes the old one). Pass `false` when adding a real sibling
   * variant, so Small and Large can both stay active.
   */
  supersedePrevious?: boolean;
}
