import { Status } from "../enum/status.enum";
import { JsonValue } from "./product-variant.dto";



export interface ProductResponseDto {
  id: number;
  name: string;
  // categoryId: number;
  // brandNameId?: number | null;
  // attributeId?: number | null;
  // parentId?: number | null;
  slug: string;
  description?: string | null;
  images: string[];
  storeCode: string
  status: Status;
  displayOrder?: number | null;
  createdById: string;
  updatedById?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  // Resolved related names — populated by list/detail endpoints (absent on raw writes).
  category?: string | null;
  brandName?: string | null;
  attribute?: string | null;
}

/** Trimmed current-price view: only the display-relevant amounts. */
export interface CurrentPriceDto {
  sellingPrice: number;
  costPrice: number | null;
}

/**
 * A sellable variant of a product, trimmed for catalog cards and pickers. Price comes from
 * the variant's currently effective PriceHistory row and stock from its stockHistory
 * movements - neither is a stored column, so both can be null/0 for a brand-new variant.
 */
export interface ProductVariantSummaryDto {
  id: number;
  sku: string;
  name: string | null;
  /** e.g. `{ "size": "L", "color": "Red" }`. Empty when the product has a single variant. */
  attributes: JsonValue;
  stockQuantity: number;
  sellingPrice: number | null;
  costPrice: number | null;
  /** Stock lives on the variant, so the low-stock trigger does too. */
  lowStockThreshold: number | null;
}

/**
 * Product enriched with related names (category, brand, attribute) as flat
 * fields, plus its current (active) price, for list/detail views.
 * `currentPrice` is null when the product has no active price.
 */
/**
 * A single product with its related names resolved, and deliberately no price or stock:
 * both are held per variant, so a product-level figure could only ever be an aggregate.
 * The detail endpoint returns this; the list endpoint still carries the aggregates because
 * catalog cards and the POS grid are built on them.
 */
export interface ProductDetailResponseDto extends ProductResponseDto {
  category: string;
  brandName: string | null;
  attribute: string | null;
}

export interface ProductWithPriceResponseDto extends ProductDetailResponseDto {
  currentPrice: CurrentPriceDto | null;
  // Current on-hand stock: the sum of all stockHistory quantity movements.
  stock: number;
  /**
   * The product's active variants. Populated by the paginated list endpoint (which
   * batches them for the whole page); absent on the low-stock and detail responses.
   */
  variants?: ProductVariantSummaryDto[];
}
