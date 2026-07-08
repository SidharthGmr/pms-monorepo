export interface CreateOrderItemModel {
  orderId: number;
  orderNumber: string;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UpdateOrderItemModel {
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}
