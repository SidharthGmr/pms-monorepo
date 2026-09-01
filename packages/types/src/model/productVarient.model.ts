import { Status } from "../enum/status.enum";

export interface ProductVariantModel {
  productId: number;
  storeCode: string;
  attributes?: any | null;
  sku?: string | null;
  name: string;
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
  /** Promotional amount for this price period; only charged while `isOffer` is on. */
  offerPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom?: Date;
  reason?: string | null;
  /** Turns the promotion on. Without an `offerPrice` it has no effect on what is charged. */
  isOffer?: boolean;
  createdById: string;
}

