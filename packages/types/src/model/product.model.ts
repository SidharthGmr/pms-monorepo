import { Status } from "../enum/status.enum";

export interface ProductModel {
  name: string;
  parentId?: number | null;
  categoryId: number;
  brandNameId?: number | null;
  attributeId?: number | null;
  slug: string;
  description?: string | null;
  // Seed the product's first ProductVariant (price/cost) and opening stock
  // movement. None of these are columns on `product`.
  sellingPrice?: number;
  costPrice?: number | null;
  stock?: number | null;
  lowStockThreshold?: number | null;
  images?: string[];
  storeCode: string
  status?: Status;
  displayOrder?: number | null;
}

