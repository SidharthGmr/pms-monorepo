import { Status } from "../enum/status.enum";

// `storeCode` and `metadata` are deliberately absent: both are marked `false` in
// `categorySelect` (`category.repository.ts`), so neither leaves the database. `metadata` is
// still accepted on create/update - it is write-only.
export interface CategoryResponseDto {
  id: number;
  name: string;
  description: string | null;
  images: string[];
  parentId: number | null;
  status: Status;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdById: string;
  updatedById: string | null;
  deletedById: string | null;
}
