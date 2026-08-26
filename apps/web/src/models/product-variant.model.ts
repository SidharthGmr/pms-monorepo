// Body accepted by POST /product-variants. `storeCode` and `createdById` are
// taken from the authenticated user's token, so they are not sent.
export interface CreateProductVariantModel {
  productId: number;
  sku?: string;
  name?: string;
  images?: string[];
  attributes?: Record<string, string | number | boolean>;
  stockQuantity?: number;
  sellingPrice: number;
  costPrice?: number | null;
  effectiveFrom?: Date | string;
  reason?: string | null;
  supersedePrevious?: boolean;
}

/**
 * Body accepted by PUT /product-variants/:id. Plain columns are written directly; a changed
 * `sellingPrice`/`costPrice` is appended to the PriceHistory ledger, and a changed
 * `stockQuantity` (target on-hand) is booked as a stock adjustment — the API handles both.
 */
export interface UpdateProductVariantModel {
  name?: string | null;
  sku?: string;
  barcode?: string | null;
  attributes?: Record<string, string | number | boolean>;
  images?: string[];
  lowStockThreshold?: number | null;
  isActive?: boolean;
  sellingPrice?: number;
  costPrice?: number | null;
  effectiveFrom?: string | null;
  stockQuantity?: number | null;
  reason?: string | null;
}
