import { Status } from "../enum/status.enum";

export interface CategoryResponseDto {
  id: number;
  storeCode: string;
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
  metadata: unknown;
}
