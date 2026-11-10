export interface OrderItemDto {
  id: number;
  orderId: number;
  orderNumber: string;
  productId: number;
  variantId?: number;
  storeCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date | string;
  /**
   * The GST on this line, derived on read from the price row the sale was priced against -
   * order items snapshot only the money, so the rate is resolved from the ledger as it stood
   * on the order date rather than as it stands today.
   */
  taxName?: string | null;
  taxRate?: number;
  taxableAmount?: number;
  taxAmount?: number;
  product?: {
    name: string;
    description?: string | null;
    slug?: string;
    hsnCode?: string | null;
    images?: string[];
  } | null;
  variant?: {
    id: number;
    name: string | null;
    sku: string;
    images?: string[];
  } | null;
}

export interface CreateOrderItemDto {
  orderId: number;
  orderNumber: string;
  productId: number;
  storeCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UpdateOrderItemDto {
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}
