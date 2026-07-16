export interface ProductPriceDto {
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
}
