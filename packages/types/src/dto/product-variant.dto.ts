
export type JsonObject = { [key: string]: JsonValue | undefined };
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface ProductVariantResponseDto {
  id: number;
  sku: string;
  name: string | null;
  barcode: string | null;
  attributes: JsonValue;
  images: string[];
  rating: number | null,
  ratingCount: number | null,
  stockQuantity: number;
  /** The list price. Still sent while an offer runs, so a client can strike it through. */
  sellingPrice: number | null;
  /** The promotional amount on the effective ledger row; null when none is set. */
  offerPrice: number | null;
  costPrice: number | null;
  lowStockThreshold: number | null;
  description: string | null;
  isActive: boolean;
  /** Whether the offer is live. Charged price is `isOffer && offerPrice != null ? offerPrice : sellingPrice`. */
  isOffer: boolean;
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
