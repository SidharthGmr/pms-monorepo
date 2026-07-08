import { Status } from "@prisma/client";

export interface CategoryModel {
  name: string;
  description?: string;
  parentId?: number;
  storeCode: string;
  status?: Status;
}

