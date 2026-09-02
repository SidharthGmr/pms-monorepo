import { Status } from "../enum/status.enum";

export interface ProductVariantModel {
  productId: number;
  storeCode: string;
  name: string;
  slug?: string;
  sku?: string;
  barcode?: string | null;
  attributes: Record<string, unknown>;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  images: string[];
  isActive: boolean;
  isOffer?: boolean;
  status: Status;
  isFeatured?: boolean;
  lowStockThreshold?: number | null;
  stockQuantity?: number | null;
  costPrice?: number | null;
  sellingPrice?: number | null;
  offerPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  reason?: string | null;
  createdById: string;
}

export interface UpdateProductVariantModel extends Partial<Omit<ProductVariantModel, "createdById" | "productId" | "storeCode">> {
  updatedById: string;
}
