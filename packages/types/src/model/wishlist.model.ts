/**
 * Body of POST /wishlists. The SKU is all that travels: the owner comes from the token, and
 * the product and store are read off the variant server-side.
 */
export interface CreateWishlistModel {
  variantId: number;
}
