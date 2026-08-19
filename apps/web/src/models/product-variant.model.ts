// Body accepted by POST /product-variants. `storeCode` and `createdById` are
// taken from the authenticated user's token, so they are not sent.
export interface CreateProductVariantModel {
  productId: number;
  /** Unique SKU. The API generates one from store + product when omitted. */
  sku?: string;
  /** Human-friendly display name for the variant, e.g. "Large / Red". Optional. */
  name?: string;
  /** Image URLs for this specific variant. */
  images?: string[];
  /**
   * What makes this variant distinct, e.g. `{ size: 'L', color: 'Red' }`. Keys are
   * master-attribute codes and values are master-entry values.
   */
  attributes?: Record<string, string | number | boolean>;
  /** Opening stock for this variant. */
  stockQuantity?: number;
  /** Filed in the PriceHistory ledger; the variant's own columns only cache it. */
  sellingPrice: number;
  costPrice?: number | null;
  effectiveFrom?: Date | string;
  reason?: string | null;
  /**
   * Defaults to `true` on the API, which retires the product's other active variants -
   * the price-change behaviour. Send `false` when adding a sibling variant so Small and
   * Large both stay active.
   */
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
