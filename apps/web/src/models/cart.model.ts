/**
 * Body for POST /carts. The API takes products, not variants, and resolves each
 * product to its currently effective variant server-side.
 */
export interface AddToCartModel {
  /** Repeated ids increase quantity, so [4, 4] adds 2 of product 4. */
  productIds?: number[];
  /**
   * Preferred by the storefront: the shopper picked a specific SKU. Sending products
   * instead lets the API fall back to the product's first active variant.
   */
  variantIds?: number[];
  /** Optional. Cart owner; the API defaults to the caller. Used by POS to build a cart for a customer. */
  userId?: string | null;
  /** Optional. Must match the store the caller is signed in to. */
  storeId?: number;
  currency?: string;
}

/** Body for PUT /carts/items/:productId - sets an absolute quantity; 0 removes the line. */
export interface UpdateCartItemModel {
  quantity: number;
  userId?: string | null;
  storeId?: number;
}
