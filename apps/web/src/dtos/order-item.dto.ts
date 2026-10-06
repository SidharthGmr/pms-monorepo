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
  createdAt: Date;
  product?: {
    name: string;
    description?: string;
    slug?: string;
    images?: string[];
  };
  variant?: {
    id: number;
    name: string;
    sku: string;
    images?: string[];
  };
}
