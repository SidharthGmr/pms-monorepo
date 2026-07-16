import { Status } from "../enum/status.enum";

export interface CategoryModel {
  name: string;
  description?: string | null;
  parentId?: number;
  storeCode: string;
  status: Status;
  displayOrder?: number
}

