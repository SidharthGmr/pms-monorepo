export interface CreateProductPriceModel {
  productId: number;
  storeCode: string;
  sellingPrice: number;
  costPrice?: number | null;
  effectiveFrom?: Date;
  reason?: string | null;
  createdById: string;
}
