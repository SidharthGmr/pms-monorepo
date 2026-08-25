import { Status } from "../enum/status.enum";
import { BasicDto } from "./list-response.dto";
import { JsonValue } from "./product-variant.dto";



export interface ProductResponseDto {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  images: string[];
  storeCode: string;
  category?: BasicDto | null;
  brandName?: BasicDto | null;
  attribute?: BasicDto | null;
  status: Status;
  displayOrder?: number | null;
  createdById: string;
  updatedById?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
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
 * A single product with its relations resolved, and deliberately no price or stock: both are
 * held per variant, so a product-level figure could only ever be an aggregate.
 *
 * Same shape as a list row - the fields are only narrowed from optional to required, because
 * the detail query always joins them.
 */
export interface ProductDetailResponseDto extends ProductResponseDto {
  category: BasicDto;
  brandName: BasicDto | null;
  attribute: BasicDto | null;
}

export interface ProductWithPriceResponseDto extends ProductDetailResponseDto {
  currentPrice: CurrentPriceDto | null;
  stock: number;
  variants?: ProductVariantSummaryDto[];
}
