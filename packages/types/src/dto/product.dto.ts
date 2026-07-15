import { Status } from "../enum/status.enum";

export interface ProductResponseDto {
  id: number;
  name: string;
  brandNameId?: number | null;
  parentId?: number | null;
  attributeId?: number | null;
  categoryId: number;
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
}
