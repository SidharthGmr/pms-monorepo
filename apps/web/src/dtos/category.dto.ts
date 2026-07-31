export interface CategoryDto {
  id: number;
  storeCode: string;
  name: string;
  description?: string | null;
  parentId?: number | null;
  status: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  createdById: string;
  updatedById?: string | null;
  deletedById?: string | null;
  metadata?: unknown;
}
