export interface CreateOrderItemModel {
  orderId: number;
  orderNumber: string;
  productId: number;
  /** Which variant was sold. Required - an order line without one cannot be fulfilled. */
  variantId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UpdateOrderItemModel {
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}
