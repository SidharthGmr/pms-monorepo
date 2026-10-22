import { Status } from "../enum/status.enum";

/**
 * A sellable variant created together with its product, price and opening stock in one
 * transaction - a product can no longer exist without at least one. The caller only picks
 * option values and a price: the server derives the name from the product plus the chosen
 * options and auto-generates the SKU and slug.
 */
export interface ProductVariantInlineModel {
  /** Present when editing: the row updates this variant. Rows without an id create new ones. */
  id?: number;
  attributes?: { attributeid: number; attributeValueId: number }[];
  sellingPrice: number;
  offerPrice?: number | null;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  stockQuantity?: number | null;
  isActive?: boolean;
  isOffer?: boolean;
  /** The offer's run, filed on the opening PriceHistory row. After effectiveTo the variant is unpriced. */
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string | null;
}

export interface ProductModel {
  name: string;
  parentId?: number | null;
  categoryId: number;
  brandNameId?: number | null;
  attributeId?: number | null;
  slug: string;
  description?: string | null;
  sellingPrice?: number;
  costPrice?: number | null;
  stock?: number | null;
  lowStockThreshold?: number | null;
  images?: string[];
  storeCode: string
  status?: Status;
  displayOrder?: number | null;
  variants?: ProductVariantInlineModel[];
}


/**
 * What the admin product form posts. `storeCode` is stamped from the token server-side,
 * so the client never sends it.
 */
export type CreateProductModel = Omit<ProductModel, 'storeCode'> & { storeCode?: string };

export type UpdateProductModel = Partial<CreateProductModel>;
