import { CartStatus } from "../enum/cart-status.enum";

export interface CartItemDto {
  id: number;
  cartId: number;
  variantId: number;
  /** Tells two lines of the same product apart, e.g. "Red / XL". */
  variantName: string;
  productId: number;
  productName: string;
  productSlug: string;
  productImages: string[];
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
  addedAt: Date | string;
  updatedAt: Date | string | null;
}

export interface CartDto {
  id: number;
  storeId: number;
  userId: string | null;
  sessionToken: string | null;
  status: CartStatus;
  currency: string;
  expiresAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
  items: CartItemDto[];
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
}
