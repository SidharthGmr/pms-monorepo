/**
 * Body accepted by POST /carts.
 *
 * The client sends products, not variants: CartItem points at ProductVariant,
 * so the service resolves each productId to the variant that is effective now
 * (the same rule product listings use for `currentPrice`).
 */
export interface AddToCartModel {
  storeId: number;
  /** null for guest carts, which are identified by sessionToken instead. */
  userId: string | null;
  sessionToken: string | null;
  /** Repeated ids increase the quantity, so [4, 4] adds 2 of product 4. */
  productIds: number[];
  /**
   * Preferred over `productIds` when the caller knows which SKU the shopper chose - a
   * storefront always does. Sending products instead falls back to the product's first
   * active variant, which silently picks the wrong size when there is more than one.
   */
  variantIds?: number[];
  currency?: string;
}

/** Body accepted by PUT /carts/items/:productId - sets an absolute quantity. */
export interface UpdateCartItemModel {
  storeId: number;
  userId: string | null;
  sessionToken: string | null;
  /** 0 removes the line. */
  quantity: number;
}
