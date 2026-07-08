export interface ProductVariantDto {
id: number;
  name: string;
  slug?: string | null;
  productId: number; 
  productAttributeId?: number | null;
  storeCode: string
  attributeId?: number | null;
  cost: number;
  Price: number;
  stock: number;
  lowStockThreshold?: number | null;
  images: string[];
  status: string; 
  createdAt: Date;
  updatedAt?: Date | null;
}
