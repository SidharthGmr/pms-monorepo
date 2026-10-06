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

/**
 * What is added on top of the subtotal. Computed on the server from the store-wide charge
 * settings so the cart page, checkout and order all agree.
 */
export interface CartChargesDto {
  subtotal: number;
  /** Percentage of the subtotal charged as tax. */
  taxRate: number;
  tax: number;
  platformFee: number;
  /** Shipping actually charged: 0 once the subtotal reaches `freeShippingAbove`. */
  shippingCharge: number;
  /** Subtotal at which shipping becomes free; null when it never does. */
  freeShippingAbove: number | null;
  shippingWaived: boolean;
  grandTotal: number;
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
  charges: CartChargesDto;
}
