export interface CategoryDto {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
}
