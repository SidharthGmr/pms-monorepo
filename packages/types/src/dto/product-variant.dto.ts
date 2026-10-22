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

/**
 * A variant row as the API reads it internally: the response fields plus the two columns
 * the services need but the client must not see - `storeCode` for the store-ownership
 * guards and `productId` for the NOT NULL stockHistory foreign key.
 *
 * Never return this from a controller; strip it with `toVariantResponse` first.
 */
export interface ProductVariantInternalDto extends ProductVariantResponseDto {
  productId: number;
  storeCode: string;
}

/** One `{ attribute, value }` pair on a variant, both sides being master-data ids. */
export interface ProductVariantAttributeDto {
  attributeid: number;
  attributeValueId: number;
}

/** What a variant's rating looks like after a vote: the caller's own score plus the new average. */
export interface VariantRatingDto {
  variantId: number;
  /** The star rating this user just gave, 1-5. */
  userRating: number;
  /** The variant's average across every rating, one decimal place. */
  rating: number | null;
  ratingCount: number;
}

/** Body accepted by POST /product-variants/rating/:id - only the score travels. */
export interface RateProductVariantModel {
  rating: number;
}
