export interface CreateProductVariantModel {
  name: string;
  slug?: string;
  productId: number; 
  productAttributeId?: number; 
  attributeId?: number;
  cost?: number | null;
  Price?: number | null;
  stock?: number | null;
  lowStockThreshold?: number | null;
  status : string;
}