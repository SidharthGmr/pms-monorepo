import { Status } from "../enum/status.enum";

export interface ProductVariantModel {
  productId: number;
  storeCode: string;
  name: string;
  slug: string;
  sku: string;
  attributes?: JSON | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status: Status;
  isFeatured: boolean;
  isActive: boolean;
  isOffer?: boolean;
  barcode?: string | null;
  images?: string[];
  lowStockThreshold?: number | null;
  stockQuantity?: number | null;
  costPrice?: number | null;
  sellingPrice: number | null;
  offerPrice?: number | null;
  compareAtPrice?: number | null;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  reason?: string | null;
  createdById: string;
}

export interface UpdateProductVariantModel extends Partial<Omit<ProductVariantModel, "createdById" | "productId" | "storeCode">> {
  updatedById: string;
}
