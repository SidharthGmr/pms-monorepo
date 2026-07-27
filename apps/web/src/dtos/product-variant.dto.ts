// Mirrors the API's ProductVariant rows (`/product-variants/...`).
// Append-only: each row is the price that took effect at `effectiveFrom`.
export interface ProductVariantDto {
  id: number;
  productId: number;
  storeCode: string;
  sellingPrice: number;
  costPrice: number | null;
  effectiveFrom: Date;
  isActive: boolean;
  reason: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt?: Date | null;
}
