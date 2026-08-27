
export type JsonObject = { [key: string]: JsonValue | undefined };
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface ProductVariantResponseDto {
  id: number;
  sku: string;
  name: string | null;
  barcode: string | null;
  attributes: JsonValue;
  images: string[];
  stockQuantity: number;
  sellingPrice: number | null;
  costPrice: number | null;
  lowStockThreshold: number | null;
  description: string | null;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
}

export interface ProductVariantListItemDto extends ProductVariantResponseDto {
  product: {
    id: number;
    name: string;
    slug: string;
  };
}
