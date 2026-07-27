export interface CartItemDto {
  id: number;
  cartId: number;
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImages: string[];
  quantity: number;
  /** Snapshot of the variant's selling price when the item was added. */
  unitPrice: number | null;
  /** unitPrice * quantity, or null when no price was captured. */
  lineTotal: number | null;
  addedAt: string;
  updatedAt: string | null;
}

export interface CartDto {
  id: number;
  storeId: number;
  userId: string | null;
  sessionToken: string | null;
  status: string;
  currency: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  items: CartItemDto[];
  /** Number of distinct lines in the cart. */
  itemCount: number;
  /** Sum of every line's quantity. */
  totalQuantity: number;
  /** Sum of every line total. */
  totalAmount: number;
}
