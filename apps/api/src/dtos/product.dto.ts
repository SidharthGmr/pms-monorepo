import { Status } from "@prisma/client";

export interface ProductResponseDto {
  id: number;
  name: string;
  brandNameId?: number | null;
  parentId?: number | null;
  attributeId?: number | null;
  categoryId: number;
  slug: string;
  description?: string | null;
  price: number;
  cost?: number | null;
  stock: number;
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

export interface CreateProductDto {
  name: string;
  brandNameId?: number | null;
  parentId?: number | null;
  attributeId?: number | null;
  slug: string;
  description?: string | null;
  price: number;
  cost?: number | null;
  stock?: number;
  lowStockThreshold?: number | null;
  categoryId: number;
  images?: string[];
  storeCode: string
  status?: Status;
  displayOrder?: number | null;
  createdById: string;
  updatedAt?: Date;
  updatedById?: string | null;
}

