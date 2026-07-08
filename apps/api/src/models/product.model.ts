import { Status } from "@prisma/client";

export interface CreateProductModel {
  name: string;
  parentId?: number | null;
  categoryId: number;
  brandNameId?: number | null;
  attributeId?: number | null;
  slug: string;
  description?: string | null;
  price: number;
  cost?: number | null;
  stock?: number | null;
  lowStockThreshold?: number | null;
  images?: string[];
  storeCode: string
  status?: Status;
  displayOrder?: number | null;
}

