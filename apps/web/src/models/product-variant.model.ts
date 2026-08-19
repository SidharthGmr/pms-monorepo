// Body accepted by POST /product-variants. `storeCode` and `createdById` are
// taken from the authenticated user's token, so they are not sent.
export interface CreateProductVariantModel {
  productId: number;
  /** Unique SKU. The API generates one from store + product when omitted. */
  sku?: string;
  /** Human-friendly display name for the variant, e.g. "Large / Red". Optional. */
  name?: string;
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
