export type JsonObject = { [key: string]: JsonValue | undefined };
export type JsonValue =
  string | number | boolean | null | JsonObject | JsonValue[];

export interface ProductVariantResponseDto {
  id: number;
  sku: string;
  name: string | null;
  barcode: string | null;
  attributes: JsonValue;
  images: string[];
  rating: number | null;
  ratingCount: number | null;
  stockQuantity: number;
  sellingPrice: number | null;
  offerPrice: number | null;
  costPrice: number | null;
  lowStockThreshold: number | null;
  description: string | null;
  isActive: boolean;
  isOffer: boolean;
  createdById: string;
  updatedById?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
}

export interface ProductVariantListItemDto extends ProductVariantResponseDto {
  product: {
    id: number;
    name: string;
    slug: string;
    categoryId: number;
    images: string[];
    category?: { name: string; images: string[] } | null;
  };
}
