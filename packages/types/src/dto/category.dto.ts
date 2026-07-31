import { Status } from "../enum/status.enum";

export interface CategoryResponseDto {
  id: number;
  storeCode: string;
  name: string;
  description: string | null;
  parentId: number | null;
  status: Status;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdById: string;
  updatedById: string | null;
  deletedById: string | null;
  // Prisma hands back `JsonValue`; `unknown` keeps this package free of a Prisma dependency
  // while staying assignment-compatible.
  metadata: unknown;
}
