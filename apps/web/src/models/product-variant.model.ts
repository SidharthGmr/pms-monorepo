// Body accepted by POST /product-variants. `storeCode` and `createdById` are
// taken from the authenticated user's token, so they are not sent.
export interface CreateProductVariantModel {
  productId: number;
  sellingPrice: number;
  costPrice?: number | null;
  effectiveFrom?: Date | string;
  reason?: string | null;
}
