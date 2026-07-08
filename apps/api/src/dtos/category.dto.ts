import { Status } from "@prisma/client";

export interface CategoryDto {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  storeCode: string
  status: Status;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDto {
  name: string;
  description?: string | null;
  parentId?: number | null;
  storeCode: string
  status?: Status;
  displayOrder?: number | null;
  createdAt: Date;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string | null;
  parentId?: number | null;
  status?: Status;
  displayOrder?: number | null;
  updatedAt?: Date;
}
