import { Status } from "../enum/status.enum";



export interface ProductResponseDto {
  id: number;
  name: string;
  // categoryId: number;
  // brandNameId?: number | null;
  // attributeId?: number | null;
  // parentId?: number | null;
  slug: string;
  description?: string | null;
  lowStockThreshold?: number | null;
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
 * Product enriched with related names (category, brand, attribute) as flat
 * fields, plus its current (active) price, for list/detail views.
 * `currentPrice` is null when the product has no active price.
 */
export interface ProductWithPriceResponseDto extends ProductResponseDto {
  category: string;
  brandName: string | null;
  attribute: string | null;
  currentPrice: CurrentPriceDto | null;
}
