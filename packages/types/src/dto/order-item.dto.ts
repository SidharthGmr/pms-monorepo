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
  product?: {
    name: string;
    description?: string | null;
    slug?: string;
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
