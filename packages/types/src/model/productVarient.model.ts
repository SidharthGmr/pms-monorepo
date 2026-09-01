import { Status } from "../enum/status.enum";

export interface ProductVariantModel {
  productId: number;
  storeCode: string;
  attributes?: any | null;
  sku?: string | null;
  /** Optional: the schema has `name String?`, and a variant is identified by its attributes. */
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
  stockQuantity?: number | null;
  costPrice?: number | null;
  sellingPrice: number | null;
  offerPrice?: number | null;
  compareAtPrice?: number | null;
  /** Defaults to now in the ledger. Optional because the variant row itself holds no price. */
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  reason?: string | null;
  /** Optional like every other column with a DB default (`Boolean @default(false)`). */
  isOffer?: boolean;
  createdById: string;
}

