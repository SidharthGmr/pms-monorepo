import { Prisma } from '@prisma/client';

export interface CreateProductVariantModel {
  productId: number;
  storeCode: string;
  /**
   * Both columns are NOT NULL in the schema, but every variant in this app is created
   * as a side effect of a price change - no caller has a real SKU or attribute set to
   * hand. Left optional here; the repository fills them in when omitted.
   */
  attributes?: Prisma.InputJsonValue; // e.g. { "size": "L", "color": "Red" }
  sku?: string;
  sellingPrice: number;
  costPrice?: number | null;
  effectiveFrom?: Date;
  reason?: string | null;
  createdById: string;
}
