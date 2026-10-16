

import { ProductVariantInlineModel } from '@pms/types';

export interface CreateProductModel {
  name: string;
  parentId?: number | null;
  categoryId: number;
  brandNameId?: number | null;
  attributeId?: number | null;
  slug: string;
  description?: string | null;
  sellingPrice?: number | null;
  costPrice?: number | null;
  stock?: number | null;
  lowStockThreshold?: number | null;
  images?: string[];
  status?: string;
  displayOrder?: number | null;
  variants?: ProductVariantInlineModel[];
}

export interface UpdateProductModel extends Partial<CreateProductModel> { }
