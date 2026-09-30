/** Body the client sends. There is no owner field - the API reads it from the JWT. */
export interface AddToCartModel {
  storeId?: number;
  productIds?: number[];
  variantIds?: number[];
  currency?: string;
}

/** Body accepted by the quantity endpoints - sets an absolute quantity. */
export interface UpdateCartItemModel {
  storeId?: number;
  quantity: number;
}

/** Server-side only: the controller fills userId from req.user, never from the request. */
export interface AddToCartCommand extends AddToCartModel {
  storeId: number;
  userId: string | null;
  sessionToken: string | null;
}

export interface UpdateCartItemCommand extends UpdateCartItemModel {
  storeId: number;
  userId: string | null;
  sessionToken: string | null;
}
