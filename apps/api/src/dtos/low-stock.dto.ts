export interface LowStockItemDto {
  id: number;
  productId: number;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  images: string[];
}
