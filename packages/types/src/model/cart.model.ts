export interface AddToCartModel {
  storeId?: number;
  userId?: string | null;
  sessionToken?: string | null;
  productIds?: number[];
  variantIds?: number[];
  currency?: string;
}

/** Body accepted by the quantity endpoints - sets an absolute quantity. */
export interface UpdateCartItemModel {
  storeId?: number;
  userId?: string | null;
  sessionToken?: string | null;
  quantity: number;
}

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
