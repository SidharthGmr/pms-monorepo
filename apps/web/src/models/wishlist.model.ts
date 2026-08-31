/**
 * The owner comes from the token and the store from the product, so only what was saved
 * travels. `variantId` pins one SKU; omit it to save the product itself.
 */
export interface CreateWishlistModel {
  productId: number;
  variantId?: number;
}
